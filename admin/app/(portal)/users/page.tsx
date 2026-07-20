import { redirect } from 'next/navigation'

// Users & Parents were merged into the People hub. Old links land on the Students list.
export default function UsersRedirect() {
  redirect('/people/students')
}
