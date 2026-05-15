import { useState, useEffect } from "react";

export default function useGitHubStars(repo: string): string {
  const [stars, setStars] = useState("0");

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.stargazers_count != null) {
          setStars(data.stargazers_count.toLocaleString());
        }
      })
      .catch(() => {});
  }, [repo]);

  return stars;
}
