import { prisma } from "../lib/prisma.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } ,
   select: {name:true, email:true} });
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  otp: string;
  otpExpiresAt: Date;
}) {
  return prisma.user.create({ data: { ...data, isVerified: false } });
}

// Refresh an existing (still unverified) registration with new details + OTP.
export function updateRegistration(
  id: string,
  data: { name: string; password: string; otp: string; otpExpiresAt: Date },
) {
  return prisma.user.update({ where: { id }, data });
}

export function setOtp(id: string, otp: string, otpExpiresAt: Date) {
  return prisma.user.update({ where: { id }, data: { otp, otpExpiresAt } });
}

export function markVerified(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isVerified: true, otp: null, otpExpiresAt: null },
  });
}

export function updatePassword(id: string, password: string) {
  return prisma.user.update({
    where: { id },
    data: { password, otp: null, otpExpiresAt: null },
  });
}
