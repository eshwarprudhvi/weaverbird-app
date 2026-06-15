fetch("https://weaverbird-app-git-main-prudhvishwar-s-projects.vercel.app/1.0.2.zip")
  .then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
  })
  .catch(err => console.error(err));
