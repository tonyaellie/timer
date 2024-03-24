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
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3),
  time: z.string().length(6), // 00h 00m 00s, stored as 6 digits
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
      toast("Timer created successfully, redirecting...");
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

  const handleNumberClick = (num: string) => {
    console.log(num);
    const { time } = form.getValues();
    if (num === "del") {
      form.setValue("time", "0" + time.slice(0, -1));
    } else {
      if (time.startsWith("00") && num == "00") {
        form.setValue("time", time.slice(2) + num);
      } else if (time.startsWith("0")) {
        form.setValue("time", time.slice(1) + num[0]);
      }
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
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" || e.key === "Delete") {
                        e.preventDefault();
                        handleNumberClick("del");
                      }

                      // check if the key is a number
                      if (e.key.match(/^[0-9]$/) && e.key !== "Enter") {
                        e.preventDefault();
                        handleNumberClick(e.key);
                      }
                    }}
                    value={`${field.value.slice(0, 2)}h ${field.value.slice(
                      2,
                      4,
                    )}m ${field.value.slice(4, 6)}s`}
                    onChange={(e) => {
                      e.preventDefault();
                    }}
                  />
                </FormControl>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("1");
                    }}
                    variant="outline"
                  >
                    1
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("2");
                    }}
                    variant="outline"
                  >
                    2
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("3");
                    }}
                    variant="outline"
                  >
                    3
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("4");
                    }}
                    variant="outline"
                  >
                    4
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("5");
                    }}
                    variant="outline"
                  >
                    5
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("6");
                    }}
                    variant="outline"
                  >
                    6
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("7");
                    }}
                    variant="outline"
                  >
                    7
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("8");
                    }}
                    variant="outline"
                  >
                    8
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("9");
                    }}
                    variant="outline"
                  >
                    9
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("00");
                    }}
                    variant="outline"
                  >
                    00
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("0");
                    }}
                    variant="outline"
                  >
                    0
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNumberClick("del");
                    }}
                    variant="destructive"
                  >
                    <Delete />
                  </Button>
                </div>
                <FormDescription>
                  This is the time the timer will run for.
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
