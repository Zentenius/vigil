"use client";

import { capitalCase } from "change-case";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

export function BreadcrumbPath() {
  const pathname = usePathname();
  const paths = pathname.split("/").slice(1);

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {paths.map((path, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${paths.slice(0, index + 1).join("/")}`}>
                   {capitalCase(path)}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {index < paths.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}