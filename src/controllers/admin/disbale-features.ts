import { DisableButtonModel } from "../../db/schema/disbale-button.schema";
import { getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import { TError } from "../../utils/utils";

export const handleDisableChat = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);

  const disabled = await DisableButtonModel.findOne({ name: "chat" }).lean();
  if (!disabled) {
    await DisableButtonModel.create({ name: "chat", disable: true });
    res.json({ message: "Button Disabled", disabled: true });
    return;
  }
  const data = await DisableButtonModel.findOneAndUpdate(
    { name: "chat" },
    { disable: !disabled.disable },
    { new: true }
  ).lean();
  res.json({ message: "Button Toggled", disabled: data?.disable });
});

export const handleDisbaleUpload = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const disabled = await DisableButtonModel.findOne({ name: "upload" }).lean();
  if (!disabled) {
    await DisableButtonModel.create({ name: "upload", disable: true });
    res.json({ message: "Button Disabled", disabled: true });
    return;
  }
  const data = await DisableButtonModel.findOneAndUpdate(
    { name: "upload" },
    { disable: !disabled.disable },
    { new: true }
  ).lean();
  res.json({ message: "Button Toggled", disabled: data?.disable });
});

export const handleDisableDelete = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const disabled = await DisableButtonModel.findOne({ name: "delete" }).lean();
  if (!disabled) {
    await DisableButtonModel.create({ name: "delete", disable: true });
    res.json({ message: "Button Disabled", disabled: true });
    return;
  }
  const data = await DisableButtonModel.findOneAndUpdate(
    { name: "delete" },
    { disable: !disabled.disable },
    { new: true }
  ).lean();
  res.json({ message: "Button Toggled", disabled: data?.disable });
});

export const handleDisbaleBackground = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const disabled = await DisableButtonModel.findOne({
    name: "background",
  }).lean();
  if (!disabled) {
    await DisableButtonModel.create({ name: "background", disable: true });
    res.json({ message: "Button Disabled", disabled: true });
    return;
  }
  const data = await DisableButtonModel.findOneAndUpdate(
    { name: "background" },
    { disable: !disabled.disable },
    { new: true }
  );
  res.json({ message: "Button Toggled", disabled: data?.disable });
});

export const handleDisableMusic = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const disabled = await DisableButtonModel.findOne({ name: "music" }).lean();
  if (!disabled) {
    await DisableButtonModel.create({ name: "music", disable: true });
    res.json({ message: "Button Disabled", disabled: true });
    return;
  }
  const data = await DisableButtonModel.findOneAndUpdate(
    { name: "music" },
    { disable: !disabled.disable },
    { new: true }
  );
  res.json({ message: "Button Toggled", disabled: data?.disable });
});

export const handlegetDisableChat = TryCatch(async (req, res) => {
  const disabled = await DisableButtonModel.findOne({ name: "chat" }).lean();
  res.json({ disabled: disabled?.disable });
});

export const handlegetDisableUpload = TryCatch(async (req, res) => {
  const disabled = await DisableButtonModel.findOne({ name: "upload" }).lean();
  res.json({ disabled: disabled?.disable });
});

export const handlegetDisableDelete = TryCatch(async (req, res) => {
  const disabled = await DisableButtonModel.findOne({ name: "delete" }).lean();
  res.json({ disabled: disabled?.disable });
});

export const handlegetDisableMusic = TryCatch(async (req, res) => {
  const disabled = await DisableButtonModel.findOne({ name: "music" }).lean();
  res.json({ disabled: disabled?.disable });
});

export const handlegetDisableBackground = TryCatch(async (req, res) => {
  const disabled = await DisableButtonModel.findOne({
    name: "background",
  }).lean();
  res.json({ disabled: disabled?.disable });
});
