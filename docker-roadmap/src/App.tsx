// src/App.tsx
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

/* =========================================
   Helpers
   ========================================= */
// Uses exact filenames like "p22_run.png", "p102_cgroups.png" etc.
const img = (key: string) => `${import.meta.env.BASE_URL ?? "/"}photos/${key}.png`;

/* =========================================
   Content model
   ========================================= */
export type Resource = { label: string; url: string };

export type CodeSpec = {
    lang: "bash" | "yaml" | "dockerfile" | "json" | "text";
    lines: string[];
};

export type TermDef = { term: string; def: string };

export type Block =
    | { kind: "image"; page: string; note?: string }
    | { kind: "text"; title?: string; body: string }
    | { kind: "list"; title?: string; items: string[] }
    | { kind: "code"; title?: string; code: CodeSpec }
    | { kind: "terms"; title?: string; defs: TermDef[] }
    | { kind: "links"; title?: string; items: Resource[] };

export type Item = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    blocks: Block[];
};

export type Group = { id: string; title: string; items: Item[] };

/* =========================================
   CONTENT — photos in *exact* sequence you gave
   ========================================= */
const groups: Group[] = [
    /* ----------------------------- 1) BASICS ----------------------------- */
    {
        id: "basics",
        title: "1) Basics & Why Docker",
        items: [
            {
                id: "overview",
                slug: "overview-objectives",
                title: "Overview & Objectives",
                summary:
                    "Why containers exist, what Docker solves, and the primitives (images, containers, layers, namespaces, cgroups).",
                blocks: [
                    { kind: "image", page: "p4", note: "Objectives / Intro" },
                    {
                        kind: "text",
                        title: "What is a container really?",
                        body:
                            "A container is just a regular process (or a few) that runs with Linux kernel isolation (namespaces) and resource governance (cgroups). " +
                            "An image provides the read-only filesystem and metadata (entrypoint, command, env); a running container adds a thin writable layer. " +
                            "Because the kernel is shared, startup is near-instant and resource use is light compared to full virtual machines."
                    },
                    {
                        kind: "text",
                        title: "Why teams keep reaching for containers",
                        body:
                            "Consistency beats configuration: we build a single artifact and promote it across environments instead of re-installing dependencies on every machine. " +
                            "The same image can be run by developers locally, in CI pipelines, on staging, and finally in production—dramatically shrinking 'works on my box' incidents. " +
                            "Containers also push us towards explicit runtime contracts: open ports, environment variables, volumes, and healthchecks are all declared instead of being implicit tribal knowledge."
                    },
                    {
                        kind: "terms",
                        title: "Core terminology",
                        defs: [
                            { term: "Image", def: "Immutable filesystem + metadata. Versioned by tags; content-addressed by digest." },
                            { term: "Container", def: "A process started from an image with isolated namespaces and cgroup limits." },
                            { term: "Layers", def: "Image is a stack of read-only layers; the container adds a small RW layer." },
                            { term: "Namespace", def: "PID/NET/MNT/UTS/IPC/USER scoping — the process sees its own world." },
                            { term: "cgroups", def: "CPU/memory/IO quotas and accounting to prevent noisy neighbors." }
                        ]
                    },
                    {
                        kind: "list",
                        title: "Problems containers solve",
                        items: [
                            "Environment drift: ship the same artifact from dev to prod.",
                            "Onboarding friction: no local snowflake installs, just `docker run`.",
                            "Slow deployments: containers start in seconds; VMs in minutes.",
                            "Hidden runtime assumptions: Dockerfile documents the runtime contract.",
                            "Patch strategy: rebuild → retag → redeploy beats manual in-place patching."
                        ]
                    }
                ]
            },
            {
                id: "matrix",
                slug: "matrix-from-hell",
                title: "Matrix from Hell (Problem)",
                summary:
                    "Different OS, library, and language versions create a combinatorial explosion. Containers collapse that matrix.",
                blocks: [
                    { kind: "image", page: "p7", note: "The pain without containers" },
                    {
                        kind: "text",
                        title: "Why this gets bad fast",
                        body:
                            "Traditional setups rely on manual package installs, system-wide paths, and implicit host state. Over time, each machine becomes unique, so code works on one dev machine but not CI or prod. " +
                            "With containers, dependencies travel with the app — what you tested is what you deploy. We also gain the ability to run multiple incompatible stacks on the same host without conflicts."
                    }
                ]
            },
            {
                id: "containers-vms",
                slug: "containers-vs-virtual-machines",
                title: "Containers vs Virtual Machines",
                summary:
                    "Containers share the host kernel; VMs bring their own kernel and full OS. Tradeoffs: speed, isolation, density, and operational model.",
                blocks: [
                    { kind: "image", page: "p12", note: "Containers vs VMs" },
                    {
                        kind: "list",
                        title: "Quick comparison",
                        items: [
                            "Startup: containers → seconds; VMs → minutes.",
                            "Footprint: MBs–hundreds of MBs vs many GBs.",
                            "Isolation: VMs stronger; containers adequate for most app workloads.",
                            "Operationally: containers favor immutable images and declarative orchestration."
                        ]
                    },
                    {
                        kind: "text",
                        title: "When to prefer each",
                        body:
                            "Prefer VMs for strong kernel isolation boundaries, legacy OS-level dependencies, or when you must run different kernels. " +
                            "Prefer containers for cloud-native apps, microservices, and CI tasks that benefit from fast start/stop and high density."
                    }
                ]
            }
        ]
    },

    /* ------------------- 2) WORKING WITH CONTAINERS (CORE) ------------------- */
    {
        id: "work",
        title: "2) Working with Containers",
        items: [
            {
                id: "core",
                slug: "core-commands",
                title: "Core Commands (Lifecycle)",
                summary:
                    "Pull, run, list, exec, stop/rm, and image housekeeping — your daily muscle memory. Photos appear in the exact sequence.",
                blocks: [
                    { kind: "image", page: "p22_run", note: "Run — start a container (nginx pull & run)" },
                    {
                        kind: "text",
                        title: "docker run basics",
                        body:
                            "`docker run IMAGE` resolves the image (local cache or pull), creates the container, sets up namespaces/cgroups, networking, and starts the process. " +
                            "Add `--name` for predictable scripting; `-d` for detached mode; `-it` to allocate a TTY for interactive shells. " +
                            "If the image defines an ENTRYPOINT and CMD, you can still pass arguments after the image name to override CMD."
                    },
                    {
                        kind: "text",
                        title: "House rules for reliable runs",
                        body:
                            "Prefer explicit tags (e.g., `nginx:1.27-alpine`) to avoid accidental upgrades. Use `--rm` for one-shot tasks to auto-clean. " +
                            "For background services, consider `--restart unless-stopped` to survive host reboots."
                    },

                    { kind: "image", page: "p23_ps", note: "docker ps / docker ps -a" },
                    {
                        kind: "text",
                        title: "Listing containers",
                        body:
                            "`docker ps` shows running containers; `-a` includes exited ones. Use `--format` to shape output (names, image, ports) and keep scripts stable across Docker versions. " +
                            "To find a container quickly: `docker ps -aq -f name=web` or `-f ancestor=nginx`."
                    },

                    { kind: "image", page: "p24_stop", note: "docker stop" },
                    { kind: "image", page: "p25_rm", note: "docker rm" },
                    {
                        kind: "text",
                        title: "Stopping & removing",
                        body:
                            "`stop` sends SIGTERM (then SIGKILL after grace). `rm` deletes the container’s RW layer and metadata. For one-shot tasks, run with `--rm` to auto-clean after exit. " +
                            "Use `docker compose down -v` to remove the compose stack *and* named volumes if you want a full reset."
                    },

                    { kind: "image", page: "p26_images", note: "docker images" },
                    { kind: "image", page: "p27_rim", note: "docker rmi (Untagged / Deleted)" },
                    {
                        kind: "text",
                        title: "Image housekeeping",
                        body:
                            "`docker images` lists local layers and tags. `rmi` removes references and layers not used by any container. " +
                            "`docker image prune` removes dangling layers; `docker system df` shows disk usage; `docker builder prune` cleans build cache."
                    },

                    { kind: "image", page: "p28_pull", note: "docker pull nginx:latest" },
                    {
                        kind: "text",
                        title: "Pull policy",
                        body:
                            "`docker pull` fetches from the remote registry. `docker run` will also pull if needed. Prefer explicit tags over `latest`. " +
                            "In CI, pin by digest (`image@sha256:…`) for bit-for-bit reproducibility."
                    },

                    { kind: "image", page: "p29_run_ubuntu", note: "docker run ubuntu" },
                    { kind: "image", page: "p30_run_ubuntu", note: "docker run ubuntu (extra)" },
                    { kind: "image", page: "p31_run_ubuntu", note: "Append a command (sleep 5)" },
                    {
                        kind: "text",
                        title: "ENTRYPOINT vs CMD",
                        body:
                            "Dockerfile `ENTRYPOINT` defines the binary; `CMD` defines default args. At runtime, extra arguments after the image name append/override `CMD`. " +
                            "Use `--entrypoint` to replace the binary itself (e.g., run a one-off shell)."
                    },

                    { kind: "image", page: "p32_exec", note: "docker exec … cat /etc/hosts" },
                    {
                        kind: "text",
                        title: "Exec into a running container",
                        body:
                            "`docker exec -it NAME sh` opens a shell in the container’s namespaces; great for quick diagnostics. " +
                            "For production, prefer troubleshooting via logs, metrics, and one-off ephemeral containers to avoid drift."
                    },

                    { kind: "image", page: "p33_attach_detach", note: "attach/detach (simple-webapp :8080)" },
                    {
                        kind: "text",
                        title: "Attach vs detach",
                        body:
                            "`docker run -d` runs in background. `docker attach` connects your terminal to STDIN/STDOUT of the main process. " +
                            "Detach with `Ctrl-p Ctrl-q` without killing the process. Remember that stopping the terminal is not the same as stopping the container."
                    },

                    { kind: "image", page: "p36_tag", note: "Run — tag (redis vs redis:4.0)" },
                    {
                        kind: "text",
                        title: "Tags matter",
                        body:
                            "Tags indicate variants (version, distro, arch). They are mutable by default — use content digests or immutable tag policies in CI/CD to pin deployments precisely. " +
                            "Multi-arch images resolve to the correct platform automatically, which is convenient on Apple Silicon and mixed fleets."
                    },

                    { kind: "image", page: "p37_STDIN", note: "STDIN / -i / -t prompt" },
                    {
                        kind: "code",
                        title: "Handy snippets",
                        code: {
                            lang: "bash",
                            lines: [
                                "# Clean all stopped containers and dangling images safely",
                                "docker container prune -f",
                                "docker image prune -f",
                                "",
                                "# Human-friendly listing",
                                "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Image}}\\t{{.Ports}}'",
                                "",
                                "# Stop & remove everything (CAREFUL in dev only)",
                                "docker stop $(docker ps -q) 2>/dev/null || true",
                                "docker rm $(docker ps -aq) 2>/dev/null || true"
                            ]
                        }
                    }
                ]
            },

            {
                id: "pvli",
                slug: "ports-volumes-logs-inspect",
                title: "Ports, Volumes, Logs & Inspect",
                summary:
                    "Publish ports to reach services, persist data with volumes, interrogate state with inspect, and follow logs for feedback.",
                blocks: [
                    { kind: "image", page: "p38_Port_mapping", note: "Run — PORT mapping" },
                    {
                        kind: "text",
                        title: "Port mapping deep dive",
                        body:
                            "`-p HOST:CONTAINER` binds a host port to a container port on bridge networks via NAT. The container still listens on its internal port. " +
                            "`-P` publishes all EXPOSEd ports to random host ports (useful in CI). Host network (Linux only) skips NAT for perf/latency but reduces isolation. " +
                            "If a port is already in use on the host, the bind will fail—choose a different HOST port."
                    },

                    { kind: "image", page: "p39_Volume_mapping", note: "Run — Volume mapping (MySQL datadir)" },
                    {
                        kind: "text",
                        title: "Volumes vs bind mounts",
                        body:
                            "Named volumes are managed by Docker and survive container recreation (ideal for DBs). Bind mounts mirror a host path (great for local dev hot-reload). " +
                            "On macOS/Windows, bind mounts traverse a VM boundary; prefer volumes for heavy I/O. Store secrets outside the image and mount them at runtime."
                    },

                    { kind: "image", page: "p40_Inspect_Container", note: "Inspect container (Config, NetworkSettings…)" },
                    {
                        kind: "code",
                        title: "Inspect patterns",
                        code: {
                            lang: "bash",
                            lines: [
                                "docker inspect api | jq '.[0].NetworkSettings.IPAddress'",
                                "docker inspect api | jq '.[0].Mounts'",
                                "docker inspect api | jq '.[0].Config.Env'",
                                "",
                                "# Show host <-> container port mappings",
                                "docker port api"
                            ]
                        }
                    },

                    { kind: "image", page: "p41_Container_Logs", note: "Container logs (Flask example)" },
                    {
                        kind: "text",
                        title: "Logs and drivers",
                        body:
                            "`docker logs` tails the JSON-file log by default. In production you may use driver integrations (journald, syslog, fluentd). " +
                            "Add structured logging and sensible rotation. Remember that logs are best treated as an event stream shipped to a central sink."
                    }
                ]
            }
        ]
    },

    /* ------------------------- 3) ENVIRONMENT VARIABLES ------------------------ */
    {
        id: "env",
        title: "3) Environment Variables",
        items: [
            {
                id: "envvars",
                slug: "environment-variables",
                title: "Environment Variables",
                summary:
                    "Default configuration via Dockerfile ENV, overrides via `-e`, and secure handling with secrets. Photos 43–49 wired in order.",
                blocks: [
                    { kind: "image", page: "p43_environment_variables", note: "Environment variables (title)" },
                    { kind: "image", page: "p44_Python", note: "Python: os.environ.get('APP_COLOR')" },
                    { kind: "image", page: "p45_Python", note: "Python demo (continued)" },
                    { kind: "image", page: "p46_Python", note: "Python run (app.py)" },
                    {
                        kind: "text",
                        title: "Precedence and patterns",
                        body:
                            "Use ENV in Dockerfile for sane defaults. Override with runtime `-e` or Compose `environment:` for environment-specific values. " +
                            "Do not bake credentials into images; prefer runtime injection via secret stores or orchestrator secrets. In Compose, `env_file:` centralizes non-sensitive config. " +
                            "Reference variables in Compose using `${VAR}` so you can switch values per developer or per CI job."
                    },
                    { kind: "image", page: "p47_ENV_in_Docker", note: "ENV in Docker (runtime -e)" },
                    { kind: "image", page: "p48_ENV_in_Docker", note: "ENV defaults vs overrides" },
                    { kind: "image", page: "p49_Inspect_Env", note: "Inspect → Config.Env" },
                    {
                        kind: "code",
                        title: "Examples",
                        code: {
                            lang: "bash",
                            lines: [
                                "docker run --rm -e APP_COLOR=blue my/web:latest",
                                "docker inspect $(docker ps -lq) | jq '.[0].Config.Env'",
                                "",
                                "# Compose",
                                "environment:",
                                "  APP_COLOR: blue",
                                "env_file:",
                                "  - .env",
                                "",
                                "# Good practice: keep secrets out of images; use runtime mounts or orchestrator secrets"
                            ]
                        }
                    }
                ]
            }
        ]
    },

    /* ------------------------------- 4) NETWORKING ------------------------------ */
    {
        id: "networking",
        title: "4) Networking — Default & User-Defined",
        items: [
            {
                id: "networks",
                slug: "default-and-user-defined-networks",
                title: "Default & User-Defined Networks",
                summary:
                    "bridge / host / none; custom bridges with subnets; embedded DNS (127.0.0.11) for service discovery. Photos 70–74.",
                blocks: [
                    { kind: "image", page: "p70_networking", note: "Networking (title)" },
                    { kind: "image", page: "p71_Default_networks", note: "Default networks: bridge / host / none" },
                    {
                        kind: "text",
                        title: "Default drivers",
                        body:
                            "Bridge: isolated network with NAT — most common for single-host dev/test. Host: use the host stack (Linux only) — lowest latency but less isolation. " +
                            "None: disable networking completely for air-gapped tasks or security-sensitive utilities that should not reach the network."
                    },

                    { kind: "image", page: "p72_User_defined_bridge", note: "User-defined bridge with custom subnet" },
                    {
                        kind: "text",
                        title: "Why user-defined bridges?",
                        body:
                            "They get automatic embedded DNS and better isolation. Define predictable subnets and attach services by name (`web`, `db`) instead of hardcoding IPs. " +
                            "Inspect networks to confirm CIDR/gateway and connected containers. Use labels to document ownership or purpose."
                    },

                    { kind: "image", page: "p73_Inspect_Network", note: "Inspect network (Gateway, IPAddress)" },
                    { kind: "image", page: "p74_Embedded_DNS", note: "Embedded DNS (127.0.0.11)" },
                    {
                        kind: "text",
                        title: "Embedded DNS",
                        body:
                            "Docker runs a small DNS server at 127.0.0.11 on user-defined bridges. Containers can resolve each other by container name or Compose service name. " +
                            "This eliminates fragile hard-coded IPs and simplifies multi-service dev environments. Combine with healthchecks so dependencies are not just reachable, but healthy."
                    }
                ]
            }
        ]
    },

    /* ----------------------- 5) COMPOSE & MULTI-CONTAINER APPS ---------------------- */
    {
        id: "compose",
        title: "5) Compose & Multi-Container Apps",
        items: [
            {
                id: "compose",
                slug: "docker-compose",
                title: "Docker Compose",
                summary:
                    "Declarative YAML for stacks: services, images/build, networks, volumes, depends_on, profiles, healthchecks, restart policies.",
                blocks: [
                    { kind: "image", page: "p85_docker_compose", note: "Compose fundamentals" },
                    { kind: "image", page: "p86_Sample_voting_app", note: "Sample voting app architecture" },
                    {
                        kind: "text",
                        title: "Why Compose",
                        body:
                            "Compose is the single source of truth for local dev and CI integration tests. It wires up networks, names, volumes, and dependencies consistently. " +
                            "Service names resolve via the embedded DNS, so `web` can reach `api` without manual IPs. You can keep override files for developer-specific tweaks."
                    },

                    { kind: "image", page: "p88_Build_vs_image_in_compose", note: "build: vs image:" },
                    {
                        kind: "text",
                        title: "Build vs image",
                        body:
                            "`image:` pulls a prebuilt image. `build:` builds from your Dockerfile. Many teams build tagged images in CI (immutable, scanned), then reference them via `image:` in Compose for deployment parity. " +
                            "For dev hot-reload you might still use `build:` and bind-mount code."
                    },

                    { kind: "image", page: "p89_Версии_compose", note: "Compose versions" },
                    { kind: "image", page: "p90_Сети_in_compose", note: "Compose networks (front-end/back-end)" },
                    {
                        kind: "code",
                        title: "Minimal Compose (dev)",
                        code: {
                            lang: "yaml",
                            lines: [
                                "services:",
                                "  web:",
                                "    build: .",
                                "    ports: ['8080:80']",
                                "    depends_on: [api]",
                                "    develop:",
                                "      watch:",
                                "        - action: sync",
                                "          path: ./src",
                                "          target: /usr/share/nginx/html",
                                "  api:",
                                "    image: user/api:1.0",
                                "    environment:",
                                "      - APP_ENV=prod"
                            ]
                        }
                    },
                    {
                        kind: "list",
                        title: "Common patterns",
                        items: [
                            "Use `profiles` to toggle optional services (e.g., monitoring).",
                            "Use `depends_on` + healthchecks for reliable startup sequencing.",
                            "Define named volumes for DBs; use bind mounts for app code hot-reload.",
                            "Split files into base + overrides (local dev, CI, prod).",
                            "Document exposed ports and env variables in README to reduce friction."
                        ]
                    }
                ]
            }
        ]
    },

    /* ---------------------------- 6) REGISTRIES & HUB ---------------------------- */
    {
        id: "registry",
        title: "6) Registries & Distribution",
        items: [
            {
                id: "registry",
                slug: "registry-and-docker-hub",
                title: "Registry (Hub & Private)",
                summary:
                    "Image naming = registry/account/repo:tag. Authenticate, tag, push, pull; optionally host a private registry.",
                blocks: [
                    { kind: "image", page: "p92_registry", note: "Registry (title)" },
                    { kind: "image", page: "p94_Image_naming", note: "Image naming anatomy" },
                    {
                        kind: "text",
                        title: "Tags vs digests",
                        body:
                            "Tags are human-friendly labels that can move. Digests (sha256:…) identify the exact content. For production rollouts, pin by digest or enforce immutable tag policies to avoid accidental upgrades. " +
                            "Use semantic tags for humans and digests for machines."
                    },

                    { kind: "image", page: "p95_Docker_Hub", note: "Docker Hub login/pull/push" },
                    { kind: "image", page: "p96_Private_registry_demo", note: "Private registry demo (registry:2)" },
                    {
                        kind: "code",
                        title: "Common flows",
                        code: {
                            lang: "bash",
                            lines: [
                                "docker login",
                                "docker tag user/api:1.0 localhost:5000/api:1.0",
                                "docker push localhost:5000/api:1.0",
                                "docker pull localhost:5000/api:1.0"
                            ]
                        }
                    },
                    {
                        kind: "list",
                        title: "Security & hygiene",
                        items: [
                            "Never bake secrets into images.",
                            "Use unique tags per build; treat images as immutable.",
                            "Enable vulnerability scanning and sign images where possible.",
                            "Scope registry credentials tightly; rotate tokens regularly."
                        ]
                    }
                ]
            }
        ]
    },

    /* ----------------------------- 7) ENGINE & DESKTOP ---------------------------- */
    {
        id: "engine",
        title: "7) Engine & OS Integration",
        items: [
            {
                id: "internals",
                slug: "engine-internals",
                title: "Engine, CLI & Internals",
                summary:
                    "dockerd exposes a REST API; docker CLI talks via local socket or -H. Isolation comes from namespaces & cgroups.",
                blocks: [
                    { kind: "image", page: "p99_Engine_Daemon_REST_API_CLI", note: "Engine / Daemon / REST API / CLI" },
                    {
                        kind: "text",
                        title: "Architecture overview",
                        body:
                            "The Docker client issues commands to the Docker Engine (daemon) over a local Unix socket or TCP (`-H`). The daemon manages images, containers, networks, and volumes; " +
                            "it implements the REST API consumed by the CLI and SDKs. Container runtime interfaces (runc/CRI-O) execute the low-level steps of creating namespaces, setting cgroups, and launching the process."
                    }
                ]
            },
            {
                id: "namespaces",
                slug: "namespaces",
                title: "Linux Namespaces",
                summary:
                    "Kernel isolation of processes, networks, mounts, IPC, hostname (UTS), and optionally user IDs.",
                blocks: [
                    { kind: "image", page: "p100_Namespaces", note: "Namespaces overview" },
                    {
                        kind: "text",
                        title: "Why namespaces",
                        body:
                            "Each container gets its own process tree (PID), mount namespace (filesystem view), network stack, and hostname, which isolates what a process can see and affect. " +
                            "User namespaces can remap root in the container to an unprivileged user on the host for defense-in-depth."
                    }
                ]
            },
            {
                id: "cgroups",
                slug: "cgroups",
                title: "cgroups & Resource Limits",
                summary: "Prevent noisy neighbors: limit CPU, memory, and I/O usage per container.",
                blocks: [
                    { kind: "image", page: "p102_cgroups", note: "cgroups overview + flags" },
                    {
                        kind: "text",
                        title: "Practical limits",
                        body:
                            "Set memory limits to avoid host OOM, and pair with CPU quotas for fair sharing. Remember that memory limits include page cache effects; " +
                            "test under load to tune realistically. Use blkio or storage-specific throttling for I/O-heavy workloads."
                    },
                    {
                        kind: "code",
                        title: "Example",
                        code: {
                            lang: "bash",
                            lines: [
                                "docker run --rm --cpus 0.5 --memory 256m --memory-swap 256m alpine:3.20 sh -c 'yes | head -n 100000'"
                            ]
                        }
                    }
                ]
            },
            {
                id: "pidns",
                slug: "pid-namespace",
                title: "PID Namespace",
                summary: "Processes get a local PID 1 inside the container; manage signals and init properly.",
                blocks: [
                    { kind: "image", page: "p102_PID_namespace", note: "PID namespace diagram" },
                    {
                        kind: "text",
                        title: "Init matters",
                        body:
                            "PID 1 has special signal semantics and is responsible for reaping zombies. For multi-process workloads use a tiny init (tini/s6) or a supervisor so signals are handled and children are reaped. " +
                            "If your app expects SIGTERM for graceful shutdown, ensure your base image or entrypoint forwards it."
                    }
                ]
            },
            {
                id: "desktop",
                slug: "windows-and-mac",
                title: "Windows & macOS",
                summary:
                    "Windows supports Windows containers & Hyper-V isolation; macOS runs Linux containers in a lightweight VM.",
                blocks: [
                    { kind: "image", page: "p104", note: "Docker on Windows (Toolbox era overview)" },
                    { kind: "image", page: "p106", note: "Toolbox components" },
                    { kind: "image", page: "p107", note: "Docker Desktop for Windows (Linux/Windows modes, Hyper-V/WSL2)" },
                    {
                        kind: "text",
                        title: "Windows containers vs Linux containers",
                        body:
                            "Windows containers run Windows userland and APIs (Server Core/Nano) with different base images and compatibility. Docker Desktop can switch between Linux and Windows container modes on Windows hosts. " +
                            "For modern dev on Windows, WSL2 tends to offer the best Linux-container experience."
                    },
                    { kind: "image", page: "p111", note: "Docker for Mac" },
                    { kind: "image", page: "p113", note: "macOS toolbox context" },
                    {
                        kind: "text",
                        title: "Desktop performance tips",
                        body:
                            "On macOS/Windows, containers run inside a VM. Bind mounts traverse the VM boundary — avoid mapping huge trees with many small files; prefer named volumes for heavy I/O. " +
                            "Allocate adequate CPU/RAM to the Docker Desktop VM and consider file-sync tools (e.g., Mutagen) for large codebases. " +
                            "Keep file watchers under control to avoid thrashing (e.g., ignore `node_modules` when possible)."
                    }
                ]
            }
        ]
    },

    /* ----------------------------- 8) ORCHESTRATION ----------------------------- */
    {
        id: "orchestration",
        title: "8) Orchestration (Swarm & Kubernetes)",
        items: [
            {
                id: "swarm",
                slug: "docker-swarm",
                title: "Docker Swarm",
                summary:
                    "Managers/workers, services with replicas, rolling updates, overlay networks, published ports.",
                blocks: [
                    { kind: "image", page: "p121_docker_swarm", note: "Swarm (title)" },
                    { kind: "image", page: "p124_Setup", note: "Swarm init & join" },
                    { kind: "image", page: "p125_Services", note: "Services, replicas, publish ports, overlay networks" },
                    {
                        kind: "text",
                        title: "Core service model",
                        body:
                            "Declare a desired state (image, replicas, ports). Swarm schedules tasks across nodes, monitors health, and converges to the target. " +
                            "Rolling updates change images gradually; you can pause, resume, or rollback. Overlay networks connect services securely across nodes."
                    },
                    {
                        kind: "code",
                        title: "Quick demo",
                        code: {
                            lang: "bash",
                            lines: [
                                "docker swarm init",
                                "docker service create --name web --replicas 3 -p 80:80 nginx",
                                "docker service ls",
                                "docker service update --image nginx:alpine web"
                            ]
                        }
                    }
                ]
            },
            {
                id: "k8s",
                slug: "kubernetes-overview",
                title: "Kubernetes (High Level)",
                summary:
                    "Pods, ReplicaSets, Deployments, Services; rolling updates; controllers converge desired state.",
                blocks: [
                    { kind: "image", page: "p127_kubernetes", note: "Kubernetes (title)" },
                    { kind: "image", page: "p128_Команды", note: "kubectl commands (scale, rollout)" },
                    {
                        kind: "text",
                        title: "Mental model",
                        body:
                            "You submit declarative manifests to the API server; controllers reconcile the actual cluster state. Pods are the smallest deployable unit; " +
                            "Deployments manage ReplicaSets for rollout/rollback; Services provide stable virtual IPs and load balancing; Ingress exposes HTTP/S. " +
                            "Autoscalers adjust capacity based on metrics; RBAC and admission controllers secure the control plane."
                    },
                    { kind: "image", page: "p133_Master_vs_Worker_Nodes", note: "Control plane & worker nodes" },
                    { kind: "image", page: "p134_kubectl", note: "kubectl cheat-sheet" },
                    {
                        kind: "code",
                        title: "Tiny Deployment",
                        code: {
                            lang: "yaml",
                            lines: [
                                "apiVersion: apps/v1",
                                "kind: Deployment",
                                "metadata: { name: web }",
                                "spec:",
                                "  replicas: 3",
                                "  selector: { matchLabels: { app: web } }",
                                "  template:",
                                "    metadata: { labels: { app: web } }",
                                "    spec:",
                                "      containers:",
                                "        - name: web",
                                "          image: nginx:alpine",
                                "          ports: [{ containerPort: 80 }]"
                            ]
                        }
                    }
                ]
            }
        ]
    }
];

/* =========================================
   UI — larger text + comfy margins
   ========================================= */
function CodeBlock({ code }: { code: CodeSpec }) {
    const label = code.lang.toUpperCase();
    return (
        <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
            <div className="px-5 py-2 text-[12px] tracking-wide uppercase text-slate-200 bg-slate-800/70 border-b border-slate-700">
                {label}
            </div>
            <pre className="p-5 text-[15px] leading-relaxed text-slate-50 overflow-auto">
        {code.lines.join("\n")}
      </pre>
        </div>
    );
}

function Terms({ defs, title }: { defs: TermDef[]; title?: string }) {
    return (
        <div className="mt-5">
            {title && <div className="text-[18px] font-semibold text-slate-900 mb-3">{title}</div>}
            <dl className="grid sm:grid-cols-2 gap-5">
                {defs.map((d, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                        <dt className="font-semibold text-slate-900 text-[18px]">{d.term}</dt>
                        <dd className="text-[16px] leading-8 text-slate-700 mt-1">{d.def}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function Links({ items, title }: { items: Resource[]; title?: string }) {
    return (
        <div className="mt-5">
            {title && <div className="text-[18px] font-semibold text-slate-900 mb-3">{title}</div>}
            <div className="flex flex-wrap gap-2">
                {items.map((r, i) => (
                    <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                    >
                        🔗 {r.label}
                    </a>
                ))}
            </div>
        </div>
    );
}

function ImageBlock({ page, note }: { page: string; note?: string }) {
    return (
        <figure className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <div className="w-full aspect-video bg-slate-900/80">
                <img
                    src={img(page)}
                    alt={note ?? page}
                    className="w-full h-full object-contain"
                    loading="lazy"
                />
            </div>
            <figcaption className="flex items-center justify-between px-3 py-1.5 text-[12px] text-slate-600">
                <span className="truncate">{note}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border text-[11px] text-slate-500">
          {page}
        </span>
            </figcaption>
        </figure>
    );
}

function TextBlock({ title, body }: { title?: string; body: string }) {
    return (
        <div className="mt-3">
            {title && <h4 className="text-[20px] font-semibold text-slate-900 mb-2">{title}</h4>}
            <p className="text-[18px] leading-9 text-slate-800 px-1 sm:px-2">
                {body}
            </p>
        </div>
    );
}

function BlockRenderer({ block }: { block: Block }) {
    switch (block.kind) {
        case "image":
            return <ImageBlock page={block.page} note={block.note} />;
        case "text":
            return <TextBlock title={block.title} body={block.body} />;
        case "list":
            return (
                <div className="mt-3">
                    {block.title && <h4 className="text-[20px] font-semibold text-slate-900 mb-2">{block.title}</h4>}
                    <ul className="list-disc pl-6 pr-2 text-[18px] leading-9 text-slate-800 space-y-1">
                        {block.items.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                </div>
            );
        case "code":
            return <CodeBlock code={block.code} />;
        case "terms":
            return <Terms defs={block.defs} title={block.title} />;
        case "links":
            return <Links items={block.items} title={block.title} />;
    }
}

function ItemCard({ item }: { item: Item }) {
    const [open, setOpen] = useState(true);
    return (
        <section className="rounded-3xl shadow-sm p-8 md:p-10 bg-white border border-slate-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 id={item.slug} className="text-[28px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                    <p className="text-[17px] leading-8 text-slate-700 mt-2">{item.summary}</p>
                </div>
                <button onClick={() => setOpen(v => !v)} className="text-sm px-3 py-1.5 rounded-full border hover:bg-gray-50">
                    {open ? "Hide" : "Details"}
                </button>
            </div>

            {open && (
                <div className="mt-6 space-y-8">
                    {item.blocks.map((b, i) => (
                        <div key={i} className={i % 2 ? "md:pl-6 md:border-l md:border-slate-200" : ""}>
                            <BlockRenderer block={b} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function Sidebar({ onJump }: { onJump: (id: string) => void }) {
    return (
        <aside className="hidden xl:block w-80 shrink-0 sticky top-24 self-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="font-semibold mb-3 text-[18px]">Contents</div>
                <ul className="space-y-3 text-[15px]">
                    {groups.map((g) => (
                        <li key={g.id}>
                            <div className="text-slate-700 font-semibold mb-1">{g.title}</div>
                            <ul className="pl-3 space-y-1">
                                {g.items.map((it) => (
                                    <li key={it.id}>
                                        <button onClick={() => onJump(it.slug)} className="text-left text-slate-600 hover:text-slate-900">
                                            • {it.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}

/* =========================================
   Page + Export PNG
   ========================================= */
export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");

    const onJump = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const haystackFromBlock = (b: Block) => {
        if (b.kind === "text") return (b.title || "") + " " + b.body;
        if (b.kind === "list") return (b.title || "") + " " + b.items.join(" ");
        if (b.kind === "terms") return (b.title || "") + " " + b.defs.map(d => d.term + " " + d.def).join(" ");
        if (b.kind === "code") return (b.title || "") + " " + b.code.lines.join(" ");
        if (b.kind === "image") return (b.note || "") + " " + b.page;
        return "";
    };

    const matches = (t: string) => t.toLowerCase().includes(query.toLowerCase());

    const filtered = groups
        .map((g) => ({
            ...g,
            items: g.items.filter(
                (it) =>
                    !query ||
                    matches(it.title) ||
                    matches(it.summary) ||
                    it.blocks.some((b) => matches(haystackFromBlock(b)))
            )
        }))
        .filter((g) => g.items.length > 0 || !query);

    const exportPNG = async () => {
        if (!containerRef.current) return;
        const canvas = await html2canvas(containerRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "docker-roadmap.png";
        a.click();
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
                <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Docker Roadmap — Interactive</h1>
                        {/* Removed tagline per request */}
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search…"
                            className="px-3 py-2 rounded-xl border bg-white text-sm w-72"
                        />
                        <button onClick={exportPNG} className="px-3 py-2 rounded-xl bg-black text-white text-sm shadow">
                            Export PNG
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
                <Sidebar onJump={onJump} />
                <main ref={containerRef} className="flex-1 space-y-8">
                    {filtered.map((g) => (
                        <section key={g.id}>
                            <h2 className="text-[26px] font-bold mb-4">{g.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {g.items.map((it) => <ItemCard key={it.id} item={it} />)}
                            </div>
                        </section>
                    ))}
                    <footer className="text-xs text-gray-500 mt-10">
                        Tip: screenshots must live in <code>public/photos/</code> with the exact filenames shown under each image badge.
                    </footer>
                </main>
            </div>
        </div>
    );
}
