import { Heading } from "@/components/atoms/Heading"
import { Button } from "@/components/ui/button"

type GreetingProps = { name: string; onLogout: () => void }

export function Greeting({ name, onLogout }: GreetingProps) {
  return (
    <div className="grid justify-items-center gap-4">
      <Heading>Hello world, {name}</Heading>
      <Button variant="outline" onClick={onLogout}>
        Log out
      </Button>
    </div>
  )
}
