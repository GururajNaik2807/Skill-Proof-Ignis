import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(200, "Bio must be under 200 characters").optional(),
});

export const githubSchema = z.object({
  username: z
    .string()
    .min(1, "GitHub username is required")
    .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Invalid GitHub username"),
});

export const resumeUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().max(5 * 1024 * 1024, "File size must be under 5MB"),
  fileType: z.literal("application/pdf"),
});