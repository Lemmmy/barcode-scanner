import { useAppStore } from "@/store/useAppStore";
import { useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { RoomCodeForm } from "./ReceiveMode";
import { RoomDiscovery } from "./RoomDiscovery";
import { Button } from "./ui/Button";
import { FormError } from "./ui/FormError";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface ReceiveModeLandingProps {
  setHasJoined: (hasJoined: boolean) => void;
}

export function ReceiveModeLanding({ setHasJoined }: ReceiveModeLandingProps) {
  const { autoDiscoverRooms } = useAppStore(
    useShallow((state) => ({
      autoDiscoverRooms: state.settings.autoDiscoverRooms,
    })),
  );

  const {
    setValue,
    handleSubmit,
    register,
    formState: { errors },
  } = useFormContext<RoomCodeForm>();

  const onSubmit = () => {
    setHasJoined(true);
  };

  const handleRoomSelect = (code: string) => {
    // Set the room code using react-hook-form and auto-submit
    setValue("roomCode", code, { shouldValidate: true });
    setHasJoined(true);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="w-full max-w-sm space-y-6">
        <div>
          <Label htmlFor="roomCode">Enter Room Code</Label>
          <Input
            type="text"
            id="roomCode"
            placeholder="0000"
            maxLength={4}
            variant="code"
            className="mt-2"
            {...register("roomCode", {
              required: "Room code is required",
              pattern: {
                value: /^\d{4}$/,
                message: "Room code must be exactly 4 digits",
              },
            })}
          />
          <FormError message={errors.roomCode?.message} className="mt-2" />
        </div>

        <Button type="submit" size="large" fullWidth>
          Join Room
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">or</span>
          </div>
        </div>

        <RoomDiscovery onRoomSelect={handleRoomSelect} autoDiscover={autoDiscoverRooms} />
      </form>
    </div>
  );
}
