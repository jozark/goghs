export async function getImageUrl(url: string): Promise<string> {
  //todo error handling
  const response = await fetch(url);
  const data = await response.json();
  return data.image;
}

export async function getVariation(url: string): Promise<string> {
  const response = await fetch("http://localhost:3001/api/getImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageurl: url,
    }),
  });

  const data = await response.json();
  return data.image_url;
}
