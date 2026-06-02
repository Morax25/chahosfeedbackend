import amqp from "amqplib";

let connection = null;
let channel = null;
let isConnecting = false;

export const connectRabbitMQ = async () => {
  try {
    if (connection && channel) {
      return channel;
    }
    if (isConnecting) {
      while (!channel) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100)
        );
      }
      return channel;
    }
    isConnecting = true;
    const rabbitUrl =
      process.env.RABBITMQ_URL ||
      "amqp://guest:guest@rabbitmq:5672";

    console.log(
      "Connecting to RabbitMQ:",
      rabbitUrl
    );

    connection = await amqp.connect(rabbitUrl);

    connection.on("error", (err) => {
      console.error(
        "RabbitMQ Connection Error:",
        err
      );
    });

    connection.on("close", () => {
      console.error(
        "RabbitMQ Connection Closed"
      );

      connection = null;
      channel = null;

      // Auto reconnect
      setTimeout(() => {
        connectRabbitMQ().catch((err) => {
          console.error(
            "RabbitMQ Reconnect Failed:",
            err
          );
        });
      }, 5000);
    });

    channel = await connection.createChannel();

    console.log("✅ RabbitMQ Connected");

    return channel;
  } catch (error) {
    console.error(
      "❌ RabbitMQ Connection Failed:",
      error
    );

    connection = null;
    channel = null;

    throw error;
  } finally {
    isConnecting = false;
  }
};

export const getChannel = async () => {
  if (!connection || !channel) {
    await connectRabbitMQ();
  }

  return channel;
};

export const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }

    if (connection) {
      await connection.close();
      connection = null;
    }

    console.log("RabbitMQ Closed");
  } catch (error) {
    console.error(
      "Error closing RabbitMQ:",
      error
    );
  }
};
