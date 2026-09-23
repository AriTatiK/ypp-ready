import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
    preferredLanguage: z.enum(["en", "fr"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const onboardingSchema = z.object({
  organizations: z.array(z.string()).min(1),
  otherText: z.string().max(200).optional(),
  preferredLanguage: z.enum(["en", "fr"]),
});

export const starAnswerSchema = z.object({
  interviewQuestionId: z.string().min(1),
  situation: z.string().max(4000),
  task: z.string().max(4000),
  action: z.string().max(4000),
  result: z.string().max(4000),
});
