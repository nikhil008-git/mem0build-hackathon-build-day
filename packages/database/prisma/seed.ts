import { prisma } from "../src/client.js";

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: "demo" },
    create: { name: "Demo Project", slug: "demo" },
    update: {},
  });

  await prisma.apiKey.upsert({
    where: { key: "rift_test_demo_key" },
    create: {
      key: "rift_test_demo_key",
      name: "Development",
      projectId: project.id,
    },
    update: {},
  });

  console.log("Seeded project:", project.slug);
  console.log("API key: rift_test_demo_key");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
