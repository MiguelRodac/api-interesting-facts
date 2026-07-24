import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import dotenv from 'dotenv'
dotenv.config()

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  })
}

const db = getFirestore()

const facts = [
  {
    content: 'El agua caliente se congela más rápido que el agua fría en ciertas condiciones.',
    source: 'Efecto Mpemba',
    imageUrl: 'https://example.com/ice.jpg',
    createdAt: new Date().toISOString(),
    createdBy: 'seed-script'
  },
  {
    content: 'Los pulpos tienen tres corazones y sangre azul.',
    source: 'Biología marina',
    imageUrl: 'https://example.com/octopus.jpg',
    createdAt: new Date().toISOString(),
    createdBy: 'seed-script'
  },
  {
    content: 'La Gran Muralla China no es visible desde el espacio a simple vista.',
    source: 'Mito espacial',
    imageUrl: 'https://example.com/wall.jpg',
    createdAt: new Date().toISOString(),
    createdBy: 'seed-script'
  },
  {
    content: 'Un día en Venus es más largo que un año en Venus.',
    source: 'Astronomía',
    imageUrl: 'https://example.com/venus.jpg',
    createdAt: new Date().toISOString(),
    createdBy: 'seed-script'
  },
  {
    content: 'Los pingüinos pueden saltar hasta 3 metros fuera del agua.',
    source: 'Ciencia Animal',
    imageUrl: 'https://example.com/penguin.jpg',
    createdAt: new Date().toISOString(),
    createdBy: 'seed-script'
  }
]

async function seed (): Promise<void> {
  const collection = db.collection('interestingFacts')

  for (const fact of facts) {
    const docRef = await collection.add(fact)
    console.log(`✅ Created: ${docRef.id} — ${fact.content.substring(0, 40)}...`)
  }

  console.log(`\n🎉 Seed complete: ${facts.length} facts added to Firestore`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
