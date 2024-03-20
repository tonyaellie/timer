import { db } from "~/server/db";
import { clerkClient } from "@clerk/nextjs";
import { CreateGroupForm } from "~/components/createGroupForm";

const Create = async () => {
  const groups = (
    await db.query.groups.findMany({
      columns: {
        name: true,
      },
    })
  ).map((group) => group.name);

  const members = (await clerkClient.users.getUserList()).map((member) => ({
    username: member.username ?? "Unknown",
    id: member.id,
  }));

  return <CreateGroupForm groups={groups} members={members} />;
};

export default Create;
