const { Kafka, logLevel, Partitioners } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKER || "localhost:9092")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);
const topic = process.env.KAFKA_TOPIC || "clickstream-events";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "clickstream-api",
  brokers,
  logLevel: logLevel.WARN,
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  createPartitioner: Partitioners.DefaultPartitioner,
});
let connectionPromise = null;

async function connectProducer() {
  if (!connectionPromise) {
    connectionPromise = producer.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
}

async function publishEvent(event) {
  await connectProducer();
  await producer.send({
    topic,
    messages: [{
      key: String(event.user_id || event.session_id || event.event_id),
      value: JSON.stringify(event),
    }],
  });
}

async function disconnectProducer() {
  if (!connectionPromise) return;
  await connectionPromise.catch(() => {});
  await producer.disconnect();
  connectionPromise = null;
}

module.exports = { connectProducer, disconnectProducer, publishEvent };
