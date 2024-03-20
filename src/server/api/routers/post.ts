import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { groups, members } from "~/server/db/schema";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 12);

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
      const resGroup = await ctx.db
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
});
