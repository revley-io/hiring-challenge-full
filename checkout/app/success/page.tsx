import { Button } from "@/components/ui/button"
import { IconCircleCheck, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-50">
          <IconCircleCheck className="size-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Order confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your purchase. You will receive a confirmation email
          shortly with your order details.
        </p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order number</span>
            <span className="font-medium">#ORD-2847</span>
          </div>
          <div className="mt-3 flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-green-600">Confirmed</span>
          </div>
        </div>

        <Button asChild variant="outline" className="mt-8 h-10 gap-2">
          <Link href="/">
            <IconArrowLeft className="size-4" />
            Back to checkout
          </Link>
        </Button>
      </div>
    </div>
  )
}
