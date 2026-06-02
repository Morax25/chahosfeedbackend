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
      const raw = msg.content.toString();
      const data = JSON.parse(raw);
      await callback(data);
      channel.ack(msg);
    } catch (error) {
      console.error("❌ Consumer error:", error);

      channel.nack(msg, false, false);
      console.log("🚫 Message rejected (not requeued)");
    }
  });
};
