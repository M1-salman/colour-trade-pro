import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(1, {
        message: "Name is required",
      })
      .regex(/^[A-Za-z]+$/, {
        message: "Name must contain only alphabets",
      }),
    email: z.string().email(),
    password: z
      .string()
      .min(6, {
        message: "Minimum 6 characters",
      })
      .regex(/^(?=.*[a-zA-Z])(?=.*[0-9]).*$/, {
        message: "Passwords must contain letters and numbers",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});


