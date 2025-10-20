// components/edit-collection-modal.tsx (Create this new file)
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea" // Assuming you have or can create this
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { logger } from "@/lib/logger"
import { aiService, type AiCollection } from "@/lib/ai-service"

interface EditCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { new_name?: string; collection_prompt?: string | null; start_text?: string | null }) => void
  initialData: {
    collection_id: string
    collection_name: string | null
    collection_prompt: string | null
    start_text: string | null
  }
}

export function EditCollectionModal({ isOpen, onClose, onSubmit, initialData }: EditCollectionModalProps) {
  const [formData, setFormData] = useState({
    new_name: initialData.collection_name || "",
    collection_prompt: initialData.collection_prompt || "",
    start_text: initialData.start_text || "",
  })

  // Update form data when initialData or isOpen changes
  useEffect(() => {
    if (isOpen && initialData.collection_name) {
      aiService.getCollectionByName(initialData.collection_name)
        .then((col) => {
          if (col) {
            setFormData({
              new_name: col.collection_name || "",
              collection_prompt: col.collection_prompt || "",
              start_text: col.start_text || "",
            })
          }
        })
        .catch((err) => {
          console.error("Error fetching collection by name", err)
        })
    }
  }, [isOpen, initialData.collection_name])
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // You might want to add a small toast or visual feedback here
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    logger.info("Submitting collection edit", { collectionId: initialData.collection_id, ...formData })
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Collection: {initialData.collection_name || "N/A"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new_name">Collection Name</Label>
            <Input
              id="new_name"
              value={formData.new_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, new_name: e.target.value }))}
              placeholder="Enter new collection name"
            />
          </div>

          <div>
            <Label htmlFor="collection_prompt">Collection Prompt</Label>
            <textarea
              id="collection_prompt"
              value={formData.collection_prompt}
              onChange={(e) => setFormData((prev) => ({ ...prev, collection_prompt: e.target.value }))}
              placeholder="Enter prompt for this collection"
              className="w-full min-h-[100px] rounded-md border border-gray-300 p-2 text-sm"
              />
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Hint:</span> You can use placeholders like {"{context}"} and {"{question}"}.
              <div className="mt-2 flex gap-2 flex-wrap">
                {["{context}", "{question}"].map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => handleCopy(token)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                  >
                    <span className="font-mono">{token}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16h8m-6 4h6a2 2 0 002-2v-6m-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v2"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="start_text">Start Text (Initial Greeting)</Label>
            <textarea
              id="start_text"
              value={formData.start_text}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_text: e.target.value }))}
              placeholder="Enter initial greeting for users"
              className="w-full min-h-[100px] rounded-md border border-gray-300 p-2 text-sm"
              />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}