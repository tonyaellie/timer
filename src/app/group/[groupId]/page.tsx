import { auth, clerkClient } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "~/components/ui/button";

import { db } from "~/server/db";

const Group = async ({
  params: { groupId },
}: {
  params: { groupId: string };
}) => {
  const user = auth();

  const group = await db.query.groups.findFirst({
    where({ id }, { eq }) {
      return eq(id, groupId);
    },
    with: {
      members: true,
      timers: true,
    },
  });

  if (!group || !group.members.some((member) => member.id === user.userId)) {
    return notFound();
  }

  const members = await clerkClient.users.getUserList();

  return (
    <div>
      <div className="pl-2">
        <div className="text-xl text-primary">{group.name}</div>
        <p>
          {group.members
            .map(
              (member) =>
                members.find((m) => m.id === member.id)?.username ?? "Unknown",
            )
            .splice(0, 3)
            .join(", ")}
          {group.members.length > 3 ? " and more" : ""}
        </p>
      </div>
      <div className="flex flex-col justify-center space-y-2 p-2">
        {group.timers.map((timer) => (
          <div
            key={timer.id}
            className="flex flex-row rounded-md border border-input bg-background p-2"
          >
            gay
          </div>
        ))}
        <Link
          href={`/group/${group.id}/create`}
          className={buttonVariants({ variant: "outline" })}
        >
          Create Timer
        </Link>
      </div>
    </div>
  );
};

export default Group;
