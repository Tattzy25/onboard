const data = {
  model_name: "test-model",
  artist_name: "test-artist",
  trigger_word: "test-trigger",
  description: "test-desc",
  tags: ["test", "tags"],
  zip_url: "https://test.com/zip.zip",
  cover_url: "https://test.com/cover.png",
  user_id: "test-user"
};

fetch("https://trigger.ai-plugin.io/triggers/webhook-debug/DroVv7RwOe5NYFan9yyOwCcn", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
.then(res => res.text())
.then(text => console.log("Webhook fired successfully:", text))
.catch(err => console.error("Webhook error:", err));
