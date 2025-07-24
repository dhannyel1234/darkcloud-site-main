'use client';

import { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from 'next/image';

import {
    Server,
    Clock,
    Users,
    Play,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Copy,
    Power,
    User,
    Timer,
    Globe,
    Lock,
    LinkIcon,
    Check,
    LockOpen,
    Tag,
    Memory,
    HardDrive,
    Cpu,
    MonitorPlay
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// ... existing code ... 