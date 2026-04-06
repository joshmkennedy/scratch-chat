import { NextRequest, NextResponse } from "next/server";

const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GIPHY_API_KEY not configured" },
      { status: 500 }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const endpoint = query ? `${GIPHY_API_URL}/search` : `${GIPHY_API_URL}/trending`;

  const params = new URLSearchParams({
    api_key: apiKey,
    limit: "24",
    rating: "g",
  });
  if (query) {
    params.set("q", query);
  }

  const res = await fetch(`${endpoint}?${params}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch from Giphy" },
      { status: 502 }
    );
  }

  const json = await res.json();

  const gifs = json.data.map(
    (gif: {
      id: string;
      title: string;
      images: {
        original: { url: string; width: string; height: string };
        fixed_height: { url: string; width: string; height: string };
        fixed_height_still: { url: string };
      };
    }) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.original.url,
      preview: gif.images.fixed_height.url,
      still: gif.images.fixed_height_still.url,
      width: Number(gif.images.original.width),
      height: Number(gif.images.original.height),
    })
  );

  return NextResponse.json({ gifs });
}
