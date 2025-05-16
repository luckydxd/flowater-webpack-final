self.addEventListener("push", function (event) {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "icon.png",
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
