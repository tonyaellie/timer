import { db } from "~/server/db";
import { auth, clerkClient } from "@clerk/nextjs";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { Plus } from "lucide-react";

const Home = async () => {
  const user = auth();

  const groups = await db.query.groups.findMany({
    with: {
      members: true,
      timers: true,
    },
  });

  const members = await clerkClient.users.getUserList();

  return (
    <div className="flex flex-col justify-center space-y-2 p-2">
      {groups
        // TODO: filtering should be done in the query
        .filter((group) =>
          group.members.some((member) => member.id === user.userId),
        )
        .map((group) => (
          <div
            key={group.id}
            className="flex flex-row rounded-md border border-input bg-background p-2"
          >
            <div className="pl-2">
              <Link
                href={`/group/${group.id}`}
                className="text-xl text-primary underline hover:text-secondary"
              >
                {group.name}
              </Link>
              <p>
                {group.members
                  .map(
                    (member) =>
                      members.find((m) => m.id === member.id)?.username ??
                      "Unknown",
                  )
                  .splice(0, 3)
                  .join(", ")}
                {group.members.length > 3 ? " and more" : ""}
              </p>
              <p>
                {group.timers.length} timer
                {group.timers.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex-grow" />
            <div className="flex flex-col">
              <div className="flex-grow" />
              <Link
                href={`/group/${group.id}/create`}
                className={buttonVariants({ size: "icon" })}
              >
                <Plus />
              </Link>
            </div>
          </div>
        ))}
      <Link href="/create" className={buttonVariants({ variant: "outline" })}>
        Create Group
      </Link>
    </div>
  );
};

export default Home;
