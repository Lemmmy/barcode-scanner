export interface NearbyRoom {
  code: string;
  clientCount: number;
  age: number;
}

export interface NearbyRoomsResponse {
  rooms: NearbyRoom[];
}

export async function discoverNearbyRooms(serverUrl?: string): Promise<NearbyRoom[]> {
  const url = serverUrl
    ? `${serverUrl}/api/nearby-rooms`
    : "/api/nearby-rooms";

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error("Failed to discover nearby rooms");
  }

  const data: NearbyRoomsResponse = await response.json();
  return data.rooms;
}
