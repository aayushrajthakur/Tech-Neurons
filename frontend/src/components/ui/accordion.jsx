import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '../../lib/utils'; // Make sure you have a `cn()` util. Or replace with `clsx()`.

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = AccordionPrimitive.Item;

export const AccordionTrigger = ({ children, ...props }) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      className={cn(
        'group flex w-full items-center justify-between bg-gray-100 px-4 py-3 font-medium text-left text-sm transition hover:bg-gray-200',
        'data-[state=open]:rounded-t-md data-[state=closed]:rounded-md'
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-2 h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

export const AccordionContent = ({ children, className, ...props }) => (
  <AccordionPrimitive.Content
    className={cn(
      'overflow-hidden bg-white text-sm text-gray-700 transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
      className
    )}
    {...props}
  >
    <div className="px-4 py-3">{children}</div>
  </AccordionPrimitive.Content>
);
