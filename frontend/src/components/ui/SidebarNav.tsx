import React from 'react';
import { Home, MessageSquare, CreditCard, Users, Layers, ShieldCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from './sidebar';

export default function SidebarNav({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-[100svh]">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="font-semibold">MatatuConnect</div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="flex items-center gap-2 w-full">
                    <Home className="size-4" />
                    <span>Home</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/feedback" className="flex items-center gap-2 w-full">
                    <MessageSquare className="size-4" />
                    <span>Feedback</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/payment" className="flex items-center gap-2 w-full">
                    <CreditCard className="size-4" />
                    <span>Payments</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/occupancy" className="flex items-center gap-2 w-full">
                    <Layers className="size-4" />
                    <span>Occupancy</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/drivers" className="flex items-center gap-2 w-full">
                    <Users className="size-4" />
                    <span>Drivers</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/dashboard" className="flex items-center gap-2 w-full">
                    <ShieldCheck className="size-4" />
                    <span>Admin</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <div className="text-xs text-muted-foreground p-2">v1.0</div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
