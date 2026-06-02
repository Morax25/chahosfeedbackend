import { connectRabbitMQ } from "./connection.js";

export const publish = async (
  queueName,
  message
) => {
  const channel = await connectRabbitMQ();

  await channel.assertQueue(queueName, {
    durable: true,
  });

  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
    }
  );
};
