import { connectRabbitMQ } from "./connection.js";

export const consume = async (
  queueName,
  callback,
  options = {}
) => {
  const channel = await connectRabbitMQ();

  await channel.assertQueue(queueName, {
    durable: true,
  });

  channel.prefetch(options.prefetch || 10);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      // 1. Raw message log (buffer level)
      console.log("📩 Raw message received:", msg.content);

      // 2. Convert buffer -> string
      const raw = msg.content.toString();
      console.log("📦 Message string:", raw);

      // 3. Parsed JSON (this is what your app uses)
      const data = JSON.parse(raw);
      console.log("🧠 Parsed message:", data);

      // 4. Before processing
      console.log("⚙️ Processing message for queue:", queueName);

      await callback(data);

      // 5. Ack after successful processing
      channel.ack(msg);
      console.log("✅ Message acknowledged");

    } catch (error) {
      console.error("❌ Consumer error:", error);

      channel.nack(msg, false, false);
      console.log("🚫 Message rejected (not requeued)");
    }
  });

  console.log(`👂 Listening on queue: ${queueName}`);
};
