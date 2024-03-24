import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="px-2 text-center space-y-2">
      <h2 className="text-2xl font-semibold text-primary">Not Found</h2>
      <p>Could not find requested resource</p>
      <Link className={buttonVariants()} href="/">
        Return Home
      </Link>
    </div>
  );
}
