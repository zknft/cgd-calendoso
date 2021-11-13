import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

import { asStringOrNull } from "@lib/asStringOrNull";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  const user = asStringOrNull(req.query.user);
  const rawUser = await prisma.user.findUnique({
    where: {
      username: user as string,
    },
    select: {
      credentials: true,
      timeZone: true,
      bufferTime: true,
      availability: true,
      id: true,
      startTime: true,
      endTime: true,
      selectedCalendars: true,
      completedOnboarding: true,
    },
  });

  console.log(rawUser);

  if (!rawUser) {
    res.status(400).json({ message: "User not found" });
    return;
  }
  if (rawUser && rawUser.completedOnboarding === false) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  res.status(200).json({ message: "User is found" });
  return;
}
