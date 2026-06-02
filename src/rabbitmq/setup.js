import { getChannel } from "./connection.js";

export const setupRabbitMQ = async () => {
  const channel = await getChannel();

  await channel.assertExchange(
    "moderation_exchange",
    "direct",
    {
      durable: true,
    }
  );

  await channel.assertQueue(
    "moderation_queue",
    {
      durable: true,
    }
  );

  await channel.bindQueue(
    "moderation_queue",
    "moderation_exchange",
    "moderation.report"
  );

  console.log(
    "✅ RabbitMQ exchange, queue and binding ready"
  );
};
