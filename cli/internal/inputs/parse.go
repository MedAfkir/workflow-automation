package inputs

import (
	"fmt"
	"strings"
)

func ParseKV(pairs []string) (map[string]string, error) {
	out := make(map[string]string, len(pairs))
	for _, p := range pairs {
		eq := strings.IndexByte(p, '=')
		if eq <= 0 {
			return nil, fmt.Errorf("--input must be key=value, got %q", p)
		}
		k := p[:eq]
		if _, dup := out[k]; dup {
			return nil, fmt.Errorf("--input %q provided more than once", k)
		}
		out[k] = p[eq+1:]
	}
	return out, nil
}
