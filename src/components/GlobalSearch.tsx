import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Building2, FolderOpen, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'company' | 'project' | 'contact';
  title: string;
  subtitle?: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const searchResults: SearchResult[] = [];
      const searchTerm = `%${query}%`;

      // Search companies (or leads as fallback)
      try {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_name, status, stage')
          .is('deleted_at', null)
          .ilike('company_name', searchTerm)
          .limit(5);

        if (companies) {
          companies.forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'company',
              title: c.company_name,
              subtitle: c.status === 'client' ? 'Cliente' : c.stage || 'Prospecto',
              href: `/empresas/${c.id}`,
            });
          });
        }
      } catch {
        // Fallback to leads table
        const { data: leads } = await supabase
          .from('leads')
          .select('id, company_name, stage')
          .ilike('company_name', searchTerm)
          .limit(5);

        if (leads) {
          leads.forEach(l => {
            searchResults.push({
              id: l.id,
              type: 'company',
              title: l.company_name,
              subtitle: l.stage,
              href: `/empresas/${l.id}`,
            });
          });
        }
      }

      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, client_id, company_id')
        .ilike('name', searchTerm)
        .limit(5);

      if (projects) {
        projects.forEach(p => {
          searchResults.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: 'Proyecto',
            href: `/projects/${p.id}`,
          });
        });
      }

      // Search contacts (company_contacts or lead_contacts)
      try {
        const { data: contacts } = await supabase
          .from('company_contacts')
          .select('id, name, company_id, role')
          .ilike('name', searchTerm)
          .limit(5);

        if (contacts) {
          contacts.forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'contact',
              title: c.name,
              subtitle: c.role || 'Contacto',
              href: `/empresas/${c.company_id}`,
            });
          });
        }
      } catch {
        // Fallback to lead_contacts
        const { data: leadContacts } = await supabase
          .from('lead_contacts')
          .select('id, name, lead_id, role')
          .ilike('name', searchTerm)
          .limit(5);

        if (leadContacts) {
          leadContacts.forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'contact',
              title: c.name,
              subtitle: c.role || 'Contacto',
              href: `/empresas/${c.lead_id}`,
            });
          });
        }
      }

      setResults(searchResults);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(href);
  }, [navigate]);

  const icons = {
    company: Building2,
    project: FolderOpen,
    contact: User,
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar empresas, proyectos, contactos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        {results.length > 0 && (
          <>
            {['company', 'project', 'contact'].map(type => {
              const typeResults = results.filter(r => r.type === type);
              if (typeResults.length === 0) return null;
              const Icon = icons[type as keyof typeof icons];
              const labels = { company: 'Empresas', project: 'Proyectos', contact: 'Contactos' };
              return (
                <CommandGroup key={type} heading={labels[type as keyof typeof labels]}>
                  {typeResults.map(result => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result.href)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
