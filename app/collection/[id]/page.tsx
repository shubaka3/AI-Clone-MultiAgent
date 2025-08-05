"use client"

import { useParams, useSearchParams } from "next/navigation"
import { CollectionDetailPage } from "@/components/collection-detail-page"

export default function CollectionPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const collectionId = params.id as string
  const collectionName = searchParams.get("name") || "Unknown Collection"
  const aiId = searchParams.get("ai_id") || ""

  return <CollectionDetailPage collectionId={collectionId} collectionName={decodeURIComponent(collectionName)} aiId={aiId} />
}
