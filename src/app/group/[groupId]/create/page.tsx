import { CreateTimerForm } from "~/components/createTimerForm";

const Create = async ({
  params: { groupId },
}: {
  params: { groupId: string };
}) => {
  return <CreateTimerForm groupId={groupId} />;
};

export default Create;
