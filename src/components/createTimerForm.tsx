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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Delete } from "lucide-react";

const formSchema = z.object({
  name: z.string(),
  time: z.string(), // 00h 00m 00s, stored as 6 digits
});

export const CreateTimerForm = ({ groupId }: { groupId: string }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      time: "000000",
    },
  });
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (submitting) return; // prevent double submission

    console.log(values);

    // create the group
    try {
      setSubmitting(true);
      // TODO: create the timer
      // const { groupId } = await createGroup.mutateAsync(values);
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
                <FormLabel>Timer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Cake baking" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of the timer you want to create.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timer Name</FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    onChange={(e) => {
                      e.preventDefault();
                    }}
                  />
                </FormControl>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    1
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    2
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    3
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    4
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    5
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    6
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    7
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    8
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    9
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    00
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    0
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("clicked 1");
                    }}
                    variant="outline"
                  >
                    <Delete />
                  </Button>
                </div>
                <FormDescription>
                  This is the name of the timer you want to create.
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
