import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import Pusher from "pusher-http-edge";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { groups, members, timers } from "~/server/db/schema";
import { env } from "~/env";
import { eq } from "drizzle-orm";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 12);

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: env.PUSHER_APP_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
  useTLS: true,
});

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        members: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // check if the group name already exists
      const groupsList = await ctx.db.query.groups.findMany({
        columns: {
          name: true,
        },
      });
      if (groupsList.some((group) => group.name === input.name)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group name already exists",
        });
      }

      // add the person creating the group to the group and deduplicate
      const membersAdding = Array.from(
        new Set([...input.members, ctx.auth.userId]),
      );

      // check if all members exist
      const membersList = (await clerkClient.users.getUserList()).map(
        (member) => member.id,
      );

      if (!membersAdding.every((member) => membersList.includes(member))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more members do not exist",
        });
      }

      const id = nanoid();

      // create the group
      await ctx.db
        .insert(groups)
        .values({
          name: input.name,
          id,
        })
        .execute();

      // add members to the group
      await ctx.db.insert(members).values(
        membersAdding.map((member) => ({
          groupId: id,
          id: member,
        })),
      );

      return { groupId: id };
    }),

  createTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        name: z.string().min(1),
        duration: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const id = nanoid();

      await ctx.db
        .insert(timers)
        .values({
          id,
          groupId: input.groupId,
          length: input.duration,
          totalPaused: 0,
          label: input.name,
          startsAt: new Date(),
        })
        .execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-created", {
        timerId: id,
        startTime: new Date().getTime(),
        length: input.duration,
        label: input.name,
      });
    }),

  pauseTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        timerId: z.string(),
        pausedAt: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
          timers: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const timer = group.timers.find((timer) => timer.id === input.timerId);

      if (!timer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timer not found",
        });
      }

      // check if the timer is already paused
      if (timer.pausedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timer is already paused",
        });
      }

      await ctx.db
        .update(timers)
        .set({
          pausedAt: new Date(input.pausedAt),
        })
        .where(eq(timers.id, input.timerId))
        .execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-paused", {
        timerId: input.timerId,
        pausedAt: input.pausedAt,
      });
    }),

  resumeTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        timerId: z.string(),
        resumedAt: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
          timers: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const timer = group.timers.find((timer) => timer.id === input.timerId);

      if (!timer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timer not found",
        });
      }

      // check if the timer is already resumed
      if (!timer.pausedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timer is already resumed",
        });
      }

      const pausedAt = timer.pausedAt.getTime();
      const resumedAt = input.resumedAt;
      const totalPaused = timer.totalPaused + (resumedAt - pausedAt);

      await ctx.db
        .update(timers)
        .set({
          totalPaused,
          pausedAt: null,
        })
        .where(eq(timers.id, input.timerId))
        .execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-resumed", {
        timerId: input.timerId,
        totalPaused,
      });
    }),

  resetTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        timerId: z.string(),
        startsAt: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
          timers: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const timer = group.timers.find((timer) => timer.id === input.timerId);

      if (!timer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timer not found",
        });
      }

      await ctx.db
        .update(timers)
        .set({
          totalPaused: 0,
          pausedAt: null,
          startsAt: new Date(input.startsAt),
        })
        .where(eq(timers.id, input.timerId))
        .execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-reset", {
        timerId: input.timerId,
        startsAt: input.startsAt,
      });
    }),

  deleteTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        timerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
          timers: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const timer = group.timers.find((timer) => timer.id === input.timerId);

      if (!timer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timer not found",
        });
      }

      await ctx.db.delete(timers).where(eq(timers.id, input.timerId)).execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-deleted", {
        timerId: input.timerId,
      });
    }),

  addTimeToTimer: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        timerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.groups.findFirst({
        where(groups, { eq }) {
          return eq(groups.id, input.groupId);
        },
        with: {
          members: true,
          timers: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (!group.members.some((member) => member.id === ctx.auth.userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const timer = group.timers.find((timer) => timer.id === input.timerId);

      if (!timer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timer not found",
        });
      }

      await ctx.db
        .update(timers)
        .set({
          length: timer.length + 60,
        })
        .where(eq(timers.id, input.timerId))
        .execute();

      await pusher.trigger(`group-${input.groupId}`, "timer-add-time", {
        timerId: input.timerId,
      });
    }),
});
