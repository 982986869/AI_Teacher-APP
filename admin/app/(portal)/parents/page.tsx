import { redirect } from 'next/navigation'

// Parents now live in the People hub. Old links land on the Parents list.
export default function ParentsRedirect() {
  redirect('/people/parents')
}
