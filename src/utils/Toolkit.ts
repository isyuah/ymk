import emitter from "@/emitter";

export function refreshPlaylists() {
  emitter.emit("refreshPlaylists");
}
