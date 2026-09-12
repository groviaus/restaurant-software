import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EditRoleLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled
            className="h-9 w-9 rounded-xl border-border/70 cursor-not-allowed shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                Role: <Skeleton className="h-7 w-32 rounded-md inline-block" />
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Security Profile
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Update role identification and configure permission capabilities
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Role Details Form Skeleton */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60 space-y-1">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Role Properties
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Base identity and description of responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        {/* Permission Matrix Skeleton */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-muted/20 border-b border-border/60">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Module Permissions Matrix
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Check privileges to grant View, Create, Edit, and Delete access per system module
                </CardDescription>
              </div>
              <Button
                disabled
                size="sm"
                className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 opacity-50 cursor-not-allowed self-start sm:self-auto"
              >
                <Save className="w-3.5 h-3.5" />
                Save Permissions
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
                      <TableHead className="py-3 pl-5 text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                        System Module
                      </TableHead>
                      <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                        View
                      </TableHead>
                      <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                        Create
                      </TableHead>
                      <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                        Edit
                      </TableHead>
                      <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                        Delete
                      </TableHead>
                      <TableHead className="py-3 pr-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider w-[120px]">
                        Quick Fill
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow key={idx} className="border-b border-border/50">
                        <TableCell className="py-3 pl-5">
                          <Skeleton className="h-4 w-32 rounded-md mb-1.5" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 pr-5 text-right">
                          <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden p-3 space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx} className="rounded-xl border border-border/70 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-10 rounded-lg" />
                      <Skeleton className="h-10 rounded-lg" />
                      <Skeleton className="h-10 rounded-lg" />
                      <Skeleton className="h-10 rounded-lg" />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
