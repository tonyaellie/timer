"use client";

import { useEffect, useRef, useState } from "react";
import type PusherType from "pusher-js";

import { Progress } from "./ui/progress";
import { env } from "~/env";
import { Button } from "./ui/button";
import { Pause, Play, TimerReset, Trash } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type Timer = {
  length: number;
  id: string;
  label: string | null;
  startsAt: Date;
  pausedAt: Date | null;
  totalPaused: number;
  groupId: string;
};

const Timer = ({
  data,
  alarmRef,
}: {
  data: Timer;
  alarmRef: React.RefObject<HTMLAudioElement>;
}) => {
  const pauseTimer = api.group.pauseTimer.useMutation();
  const resumeTimer = api.group.resumeTimer.useMutation();
  const resetTimer = api.group.resetTimer.useMutation();
  const deleteTimer = api.group.deleteTimer.useMutation();
  const addTimeToTimer = api.group.addTimeToTimer.useMutation();

  const [loadingPause, setLoadingPause] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingAddTime, setLoadingAddTime] = useState(false);

  const [startedAlarm, setStartedAlarm] = useState(false);

  const currentTimeOrPausedAt =
    data.pausedAt?.getTime() ?? new Date().getTime();
  const startTimeWithPaused = data.startsAt.getTime() + data.totalPaused;

  const timeCompleted = (currentTimeOrPausedAt - startTimeWithPaused) / 1000;

  const completed = timeCompleted >= data.length;

  if (completed && !startedAlarm && alarmRef.current) {
    alarmRef.current.currentTime = 0;
    void alarmRef.current.play();
    setStartedAlarm(true);
  }

  const timeLeft = data.length - timeCompleted;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.floor(timeLeft % 60);

  return (
    <div
      key={data.id}
      className="flex flex-col space-y-2 rounded-md border border-input bg-background p-2"
    >
      <div className="flex space-x-2">
        {data.label && <div className="text-lg">{data.label}</div>}
        <div className="flex-grow" />
        <Button
          disabled={loadingPause || completed}
          size="icon"
          onClick={async () => {
            setLoadingPause(true);
            if (data.pausedAt) {
              await resumeTimer.mutateAsync({
                groupId: data.groupId,
                timerId: data.id,
                resumedAt: new Date().getTime(),
              });
              toast("Timer resumed");
            } else {
              await pauseTimer.mutateAsync({
                groupId: data.groupId,
                timerId: data.id,
                pausedAt: new Date().getTime(),
              });
              toast("Timer paused");
            }
            setLoadingPause(false);
          }}
        >
          {data.pausedAt ? <Play /> : <Pause />}
        </Button>
        <Button
          disabled={loadingAddTime || completed}
          size="icon"
          variant="outline"
          onClick={async () => {
            setLoadingAddTime(true);
            await addTimeToTimer.mutateAsync({
              groupId: data.groupId,
              timerId: data.id,
            });
            toast("Time added to timer");
            setLoadingAddTime(false);
          }}
        >
          +1:00
        </Button>
        <Button
          disabled={loadingReset}
          size="icon"
          variant="outline"
          onClick={async () => {
            setLoadingReset(true);
            await resetTimer.mutateAsync({
              groupId: data.groupId,
              timerId: data.id,
              startsAt: new Date().getTime(),
            });
            toast("Timer reset");
            setLoadingReset(false);
          }}
        >
          <TimerReset />
        </Button>
        <Button
          disabled={loadingDelete}
          size="icon"
          variant="destructive"
          onClick={async () => {
            setLoadingDelete(true);
            await deleteTimer.mutateAsync({
              groupId: data.groupId,
              timerId: data.id,
            });
            toast("Timer deleted");
            setLoadingDelete(false);
          }}
        >
          <Trash />
        </Button>
      </div>
      <Progress
        value={completed ? 100 : (timeCompleted / data.length) * 100}
        text={
          completed
            ? "Completed"
            : hours !== 0
              ? `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
              : minutes !== 0
                ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
                : `${seconds}s`
        }
      />
    </div>
  );
};

export const Timers = ({
  timers: timersInput,
  groupId,
}: {
  timers: Timer[];
  groupId: string;
}) => {
  const [timers, setTimers] = useState(timersInput);
  const alarmRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!window) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const Pusher = require("pusher-js/with-encryption") as typeof PusherType;

    const pusher = new Pusher(env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    });

    const channel = pusher.subscribe(`group-${groupId}`);

    channel.bind(
      "timer-created",
      (event: {
        timerId: string;
        startTime: number;
        length: number;
        label: string;
      }) => {
        setTimers((prev) => [
          ...prev,
          {
            id: event.timerId,
            length: event.length,
            label: event.label,
            startsAt: new Date(event.startTime),
            pausedAt: null,
            totalPaused: 0,
            groupId,
          },
        ]);
      },
    );

    channel.bind(
      "timer-paused",
      (event: { timerId: string; pausedAt: number }) => {
        setTimers((prev) =>
          prev.map((timer) =>
            timer.id === event.timerId
              ? {
                  ...timer,
                  pausedAt: new Date(event.pausedAt),
                }
              : timer,
          ),
        );
      },
    );

    channel.bind(
      "timer-resumed",
      (event: { timerId: string; totalPaused: number }) => {
        setTimers((prev) =>
          prev.map((timer) =>
            timer.id === event.timerId
              ? {
                  ...timer,
                  totalPaused: event.totalPaused,
                  pausedAt: null,
                }
              : timer,
          ),
        );
      },
    );

    channel.bind(
      "timer-reset",
      (event: { timerId: string; startsAt: number }) => {
        setTimers((prev) =>
          prev.map((timer) =>
            timer.id === event.timerId
              ? {
                  ...timer,
                  startsAt: new Date(event.startsAt),
                  totalPaused: 0,
                  pausedAt: null,
                }
              : timer,
          ),
        );
      },
    );

    channel.bind("timer-deleted", (event: { timerId: string }) => {
      setTimers((prev) => prev.filter((timer) => timer.id !== event.timerId));
    });

    channel.bind("timer-add-time", (event: { timerId: string }) => {
      setTimers((prev) =>
        prev.map((timer) =>
          timer.id === event.timerId
            ? {
                ...timer,
                length: timer.length + 60,
              }
            : timer,
        ),
      );
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // force a re-render every 200ms, this is to update the timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <audio ref={alarmRef} controls>
        <source src="/alarm.mp3" type="audio/mpeg" />
      </audio>
      {timers
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .map((timer) => (
          <Timer data={timer} key={timer.id} alarmRef={alarmRef} />
        ))}
    </>
  );
};
