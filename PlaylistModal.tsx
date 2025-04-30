

import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Label } from "./label"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Button } from "./button"

interface PlaylistModalProps {
  onConfirm: (makePlaylist: boolean) => void;
}

export function PlaylistModal({ onConfirm }: PlaylistModalProps) {
  const [open, setOpen] = React.useState(false);
  const [makePlaylist, setMakePlaylist] = React.useState("yes");

  const handleConfirm = () => {
    onConfirm(makePlaylist === "yes");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">🎵 Make a Playlist?</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Would you like to create a playlist?</DialogTitle>
        <RadioGroup
          defaultValue="yes"
          onValueChange={setMakePlaylist}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}