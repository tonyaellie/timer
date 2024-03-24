"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { X } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "./ui/command";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Command as CommandPrimitive } from "cmdk";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Member = Record<"value" | "label", string>;

const FancyMultiSelect = ({
  members,
  updateSelected,
  selectedMembers,
}: {
  members: Member[];
  updateSelected: (selected: Member[]) => void;
  selectedMembers: Member[];
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Member[]>(selectedMembers);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    updateSelected(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleUnselect = useCallback((member: Member) => {
    setSelected((prev) => prev.filter((s) => s.value !== member.value));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelected((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        // This is not a default behaviour of the <input /> field
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [],
  );

  const selectables = members.filter((member) => !selected.includes(member));

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((member) => {
            return (
              <Badge key={member.value} variant="secondary">
                {member.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(member);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(member)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          {/* Avoid having the "Search" Icon */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder="Select members..."
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 ? (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto">
              {selectables
                .filter((member) =>
                  selected.every((s) => s.value !== member.value),
                )
                .map((member) => {
                  return (
                    <CommandItem
                      key={member.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        setSelected((prev) => [...prev, member]);
                      }}
                      className={"cursor-pointer"}
                    >
                      {member.label}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </div>
        ) : null}
      </div>
    </Command>
  );
};

const formSchema = z.object({
  name: z.string(),
  members: z.array(z.string()),
});

export const CreateGroupForm = ({
  groups,
  members,
}: {
  groups: string[];
  members: { username: string; id: string }[];
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      members: [],
    },
  });
  const router = useRouter();

  const createGroup = api.group.create.useMutation();

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (submitting) return; // prevent double submission

    console.log(values);
    // check if the group name already exists
    if (groups.includes(values.name)) {
      form.setError("name", {
        type: "manual",
        message: "Group name already exists",
      });
      return;
    }

    // check if all members exist
    if (
      !values.members.every((member) => members.some((m) => m.id === member))
    ) {
      form.setError("members", {
        type: "manual",
        message: "One or more members do not exist",
      });
      return;
    }

    // create the group
    try {
      setSubmitting(true);
      const { groupId } = await createGroup.mutateAsync(values);
      toast("Group created successfully, redirecting...");
      // redirect to the group page
      router.push(`/group/${groupId}`);
    } catch (error) {
      // TODO: proper error handling
      form.setError("root", {
        type: "manual",
        message: "Something went wrong",
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="Cooking club" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of the group you want to create.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="members"
            render={() => (
              <FormItem>
                <FormLabel>Members</FormLabel>
                <FormControl>
                  <FancyMultiSelect
                    members={members.map((member) => ({
                      value: member.id,
                      label: member.username,
                    }))}
                    updateSelected={(selected) => {
                      form.setValue(
                        "members",
                        selected.map((s) => s.value),
                      );
                    }}
                    selectedMembers={form
                      .getValues("members")
                      .map((member) => ({
                        value: member,
                        label: members.find((m) => m.id === member)!.username,
                      }))}
                  />
                </FormControl>
                <FormDescription>
                  These are the members of the group you want to create.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={submitting} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
