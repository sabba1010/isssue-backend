import { ChatModel } from "../../db/schema/chat.schema";
import { UserModel } from "../../db/schema/user.schema";
import { getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import {
  isFunctionDisable,
  removeFile,
  TError,
  verifyToken,
} from "../../utils/utils";

async function isSpammer(ip: string) {
  const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000);
  const chat = await ChatModel.find({
    createdAt: { $gt: sixtyMinAgo },
    ip: ip,
  }).select("message");
  if (!chat.length || chat.length <= 10) return false;
  let sameMessageCount = 1;
  let firstMessage = chat[0].message?.toLowerCase();
  for (let i = 1; i < chat.length; i++) {
    const message = chat[i].message?.toLowerCase();
    if (message === firstMessage) {
      firstMessage = message;
      sameMessageCount++;
    }
  }
  const sameMessagePercent = (sameMessageCount / chat.length) * 100;
  return sameMessagePercent >= 90;
}

async function usingBlockedText(message: string): Promise<boolean> {
  if (!message) return false;
  if (!process.env.BLOCKED_TEXTS) return false;
  const blockedTexts = process.env.BLOCKED_TEXTS.split(",").filter(Boolean);

  // Normalize message: lowercase, remove underscores, dashes, etc.
  const normalizedMessage = message.toLowerCase().replace(/[\s\-_.]+/g, "");

  for (const text of blockedTexts) {
    const normalizedText = text.toLowerCase().replace(/[\s\-_.]+/g, "");
    if (normalizedMessage.includes(normalizedText)) {
      return true;
    }
  }

  return false;
}

const SaveChat = TryCatch(async (req, res) => {
  const body = req.body as {
    message: string;
    sentTo?: string;
    files: string[];
    token?: string;
    roomId?: string;
  };
  if (!req.ip) return TError("Something went wrong", 400);
  const token = req.headers.authorization;
  const [isBlocked, user, isFunctionDisabled] = await Promise.all([
    usingBlockedText(body.message),
    getCurrentUser(token),
    isFunctionDisable("chat"),
  ]);
  if (isFunctionDisabled) return res.json({ message: {}, user: null });
  if (isBlocked) return res.json({ message: {}, user: null });
  if (!token && !body.token) return TError("Something went wrong", 400);
  if (user) {
    if (user.isSpammer) return res.json({ message: {}, user: null });
    const isSpam = await isSpammer(req.ip);
    if (isSpam) {
      await UserModel.findByIdAndUpdate(user._id, {
        $set: { spammer: isSpam },
      });
      return res.json({ message: {}, user: null });
    }
    const chat = await ChatModel.create({
      user: user._id,
      message: body.message,
      sentTo: body.sentTo,
      sentBy: user?._id,
      files: body.files,
      ip: req.ip,
      ips: req.ips || [],
      origin: req.get("Origin") || req.get("Referer"),
      userAgent: req.get("user-agent") || "",
      roomId: body.roomId,
    });
    const getuser = await UserModel.findById(user._id);
    res.json({ chat, user: getuser });
  } else {
    const isTokenValid = verifyToken(body.token!);
    if (!isTokenValid) return TError("Something went wrong", 400);
    const findOneMessage = await ChatModel.findOne({
      ip: req.ip,
      spammer: true,
    })
      .sort({ createdAt: -1 })
      .lean();
    if (findOneMessage?.spammer) return res.json({ message: {}, user: null });
    const isSpam = await isSpammer(req.ip);
    if (isSpam) {
      await ChatModel.findOneAndUpdate(
        { ip: req.ip },
        { $set: { spammer: isSpam } }
      );
      return res.json({ message: {}, user: null });
    }

    const chat = await ChatModel.create({
      message: body.message,
      files: body.files,
      token: body.token,
      ip: req.ip,
      ips: req.ips || [],
      origin: req.get("Origin") || req.get("Referer"),
      userAgent: req.get("user-agent") || "",
      roomId: body.roomId,
    });
    res.json({ chat, user: null });
  }
});

const GetAllChats = TryCatch(async (req, res) => {
  const chatingWith = req.query.chatingWith;
  const token = req.headers.authorization;
  const [user, spamMessage] = await Promise.all([
    getCurrentUser(token),
    ChatModel.findOne({ spammer: true }).sort({ createdAt: -1 }).lean(),
  ]);

  const spamIP = spamMessage?.ip;

  if (chatingWith) {
    const chats = await ChatModel.find({
      $and: [
        {
          $or: [
            {
              $and: [{ sentBy: user?._id }, { sentTo: chatingWith }],
            },
            {
              $and: [{ sentBy: chatingWith }, { sentTo: user?._id }],
            },
          ],
        },
        spamIP ? { ip: { $ne: spamIP } } : {},
      ],
    })
      .select(["-spammer", "-ip", "-ips", "-token", "-origin", "-userAgent"])
      .populate("user")
      .lean();
    res.json({ chats });
  } else {
    const chats = await ChatModel.find({
      $and: [
        { $or: [{ sentTo: null }, { sentTo: undefined }] },
        spamIP ? { ip: { $ne: spamIP } } : {},
      ],
    })
      .select(["-ip", "-ips", "-token", "-spammer", "-origin", "-userAgent"])
      .populate("user")
      .lean();
    res.json({ chats });
  }
});

const DeleteChat = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const isPrivate = req.query.isPrivate;
  const chatingWith = req.query.chatingWith;
  const [user, isDisable] = await Promise.all([
    getCurrentUser(token),
    isFunctionDisable("delete"),
  ]);

  if (isDisable) return TError("Delete is currently disabled", 400);
  if (!user) return TError("Unauthorized", 401);

  if (isPrivate) {
    if (chatingWith) {
      // ONLY delete conversation between user and this specific friend
      await ChatModel.deleteMany({
        $or: [
          { $and: [{ sentBy: user._id }, { sentTo: chatingWith }] },
          { $and: [{ sentBy: chatingWith }, { sentTo: user._id }] }
        ]
      });
    } else {
      // Delete ALL private messages for this specific user
      await ChatModel.deleteMany({
        $or: [{ sentBy: user._id }, { sentTo: user._id }]
      });
    }
    return res.json({ message: "Private messages deleted successfully", isPrivate: true });
  }

  // Handle Public Deletion
  if (user.roles.includes("admin")) {
    await ChatModel.deleteMany({ $or: [{ sentTo: null }, { sentTo: undefined }] });
    res.json({ message: "Public chat cleared by admin" });
  } else {
    // Regular users only delete their own public messages
    await ChatModel.deleteMany({
      sentBy: user._id,
      $or: [{ sentTo: null }, { sentTo: undefined }]
    });
    res.json({ message: "Your public messages cleared" });
  }
});

const UpdateChat = TryCatch(async (req, res) => {
  const id = req.params.id;
  const body = req.body as { message: string };
  if (!body.message) {
    const chat = await ChatModel.findById(id);
    res.json({ chat });
    return;
  }
  const chat = await ChatModel.findByIdAndUpdate(
    id,
    { $set: { message: body.message } },
    { new: true }
  )
    .populate("user")
    .lean();
  res.json({ chat });
});

const handleDeleteChat = TryCatch(async (req, res) => {
  const id = req.params.id as string;
  const chat = await ChatModel.findByIdAndDelete(id);
  if (!chat) return TError("Chat not found", 404);
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return TError("User not found", 404);
  if (chat.user.toString() !== user._id.toString())
    return TError("You are not authorized to delete this chat", 403);
  if (chat?.files) {
    chat.files.forEach((file) => {
      removeFile(file.replace(`${process.env.BASE_URL}/public/`, ""));
    });
  }
  await ChatModel.findByIdAndDelete(id);
  res.json({ message: "Chat deleted successfully" });
});

export { SaveChat, DeleteChat, GetAllChats, UpdateChat, handleDeleteChat };
