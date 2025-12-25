'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteUser } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function DeleteUser({ user_id }) {
  const [isOpen, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await deleteUser(user_id)
      if (error) {
        toast.error('Error deleting user')
        setIsDeleting(false)
        return
      }
      toast.success('User deleted')
      setOpen(false)
      setIsDeleting(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error deleting user')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive hover:text-destructive"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete pod account</DialogTitle>
          <DialogDescription>
            This will delete the user. This action can’t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
