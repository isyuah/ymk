package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// SourceEntityType enum values
const (
	SourceEntityTypeSong     = 0
	SourceEntityTypePlaylist = 1
	SourceEntityTypeLyric    = 4
)

// --- V1 types ---

type V1Document struct {
	Pic             string                   `json:"pic"`
	Title           string                   `json:"title"`
	Intro           string                   `json:"intro,omitempty"`
	OriginFilename  string                   `json:"originFilename,omitempty"`
	Type            string                   `json:"type,omitempty"`
	Playlist        []map[string]interface{} `json:"playlist"`
}

// --- V2 types ---

type V2Document struct {
	SchemaVersion int            `json:"SchemaVersion"`
	Title         string         `json:"title"`
	Pic           string         `json:"pic"`
	Intro         string         `json:"intro,omitempty"`
	Entries       []V2Entry      `json:"entries"`
}

type V2Entry struct {
	Kind    string     `json:"kind"`
	Songs   []V2Song   `json:"songs,omitempty"`
	Ref     *V2Ref     `json:"ref,omitempty"`
}

type V2Song struct {
	SourceType   string  `json:"sourceType"`
	Symbol       string  `json:"symbol"`
	Title        string  `json:"title,omitempty"`
	Singer       string  `json:"singer,omitempty"`
	Pic          string  `json:"pic,omitempty"`
	Extra        any     `json:"extra,omitempty"`
	LyricOverride *V2Ref `json:"lyricOverride,omitempty"`
	LyricOffset  *float64 `json:"lyricOffset,omitempty"`
}

type V2Ref struct {
	SourceType string `json:"sourceType"`
	Symbol     string `json:"symbol"`
	Type       int    `json:"type"`
	Extra      any    `json:"extra,omitempty"`
}

// toStr converts a JSON value to a string, handling json.Number for large ints.
func toStr(v interface{}) string {
	switch t := v.(type) {
	case json.Number:
		return t.String()
	case string:
		return t
	default:
		return fmt.Sprintf("%v", v)
	}
}

func decodeJSON(data []byte, target interface{}) error {
	dec := json.NewDecoder(strings.NewReader(string(data)))
	dec.UseNumber()
	return dec.Decode(target)
}

func convertSong(raw map[string]interface{}) V2Song {
	song := V2Song{}

	// type → sourceType
	if t, ok := raw["type"].(string); ok {
		song.SourceType = t
	}

	// symbol → string (preserving large int precision)
	song.Symbol = toStr(raw["symbol"])

	// Direct fields
	if v, ok := raw["title"].(string); ok {
		song.Title = v
	}
	if v, ok := raw["singer"].(string); ok {
		song.Singer = v
	}
	if v, ok := raw["pic"].(string); ok {
		song.Pic = v
	}

	// bilibili p → extra
	if p, ok := raw["p"]; ok {
		switch v := p.(type) {
		case float64:
			song.Extra = map[string]interface{}{"p": int(v)}
		case json.Number:
			i, _ := v.Int64()
			song.Extra = map[string]interface{}{"p": int(i)}
		}
	}

	// customLyric → lyricOverride
	if cl, ok := raw["customLyric"].(map[string]interface{}); ok {
		symbol := toStr(cl["symbol"])
		sourceType, _ := cl["type"].(string)
		song.LyricOverride = &V2Ref{
			SourceType: sourceType,
			Symbol:     symbol,
			Type:       SourceEntityTypeLyric,
		}
	}

	// lyricOffset
	if lo, ok := raw["lyricOffset"]; ok {
		switch v := lo.(type) {
		case float64:
			song.LyricOffset = &v
		case json.Number:
			f, _ := v.Float64()
			song.LyricOffset = &f
		case int:
			f := float64(v)
			song.LyricOffset = &f
		}
	}

	return song
}

func convertComponent(comp map[string]interface{}) (V2Entry, bool) {
	compType, _ := comp["type"].(string)

	switch compType {
	case "data":
		songs := []V2Song{}
		if rawSongs, ok := comp["songs"].([]interface{}); ok {
			for _, rs := range rawSongs {
				if m, ok := rs.(map[string]interface{}); ok {
					songs = append(songs, convertSong(m))
				}
			}
		}
		return V2Entry{Kind: "inlineSongs", Songs: songs}, true

	case "trace_bilibili_fav":
		favid := toStr(comp["favid"])
		ref := &V2Ref{
			SourceType: "bilibili",
			Symbol:     favid,
			Type:       SourceEntityTypePlaylist,
		}
		if expandAll, ok := comp["expandAll"].(bool); ok && expandAll {
			ref.Extra = map[string]interface{}{"expandAll": true}
		}
		return V2Entry{Kind: "playlistRef", Ref: ref}, true

	case "trace_netease_playlist":
		id := toStr(comp["id"])
		return V2Entry{
			Kind: "playlistRef",
			Ref:  &V2Ref{SourceType: "netease", Symbol: id, Type: SourceEntityTypePlaylist},
		}, true

	case "trace_qq_playlist":
		id := toStr(comp["id"])
		return V2Entry{
			Kind: "playlistRef",
			Ref:  &V2Ref{SourceType: "qq", Symbol: id, Type: SourceEntityTypePlaylist},
		}, true

	case "trace_kugou_playlist":
		id := toStr(comp["id"])
		return V2Entry{
			Kind: "playlistRef",
			Ref:  &V2Ref{SourceType: "kugou", Symbol: id, Type: SourceEntityTypePlaylist},
		}, true

	case "trace_siren":
		return V2Entry{
			Kind: "playlistRef",
			Ref:  &V2Ref{SourceType: "siren", Symbol: "", Type: SourceEntityTypePlaylist},
		}, true

	default:
		fmt.Printf("  WARNING: unknown component type %q, skipping\n", compType)
		return V2Entry{}, false
	}
}

func convertV1toV2(v1 V1Document) V2Document {
	v2 := V2Document{
		SchemaVersion: 2,
		Title:         v1.Title,
		Pic:           v1.Pic,
		Intro:         v1.Intro,
		Entries:       []V2Entry{},
	}

	for _, comp := range v1.Playlist {
		if entry, ok := convertComponent(comp); ok {
			v2.Entries = append(v2.Entries, entry)
		}
	}

	return v2
}

func isV2(raw map[string]interface{}) bool {
	sv, ok := raw["SchemaVersion"]
	if !ok {
		return false
	}
	switch v := sv.(type) {
	case float64:
		return v == 2
	case json.Number:
		i, _ := v.Int64()
		return i == 2
	case int:
		return v == 2
	}
	return false
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: v1-to-v2 <lists-dir>")
		fmt.Println("  Converts V1 playlist JSONs to V2 format.")
		fmt.Println("  Original files are backed up with .v1.bak suffix.")
		os.Exit(1)
	}

	dir := os.Args[1]
	entries, err := os.ReadDir(dir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading directory: %v\n", err)
		os.Exit(1)
	}

	converted := 0
	skipped := 0

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".v1.bak") {
			continue
		}

		filePath := filepath.Join(dir, entry.Name())
		raw, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR reading %s: %v\n", entry.Name(), err)
			continue
		}

		// Parse as raw map to detect version
		var rawMap map[string]interface{}
		if err := decodeJSON(raw, &rawMap); err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR parsing %s: %v\n", entry.Name(), err)
			continue
		}

		if isV2(rawMap) {
			fmt.Printf("  SKIP %s (already V2)\n", entry.Name())
			skipped++
			continue
		}

		// Parse as V1
		var v1 V1Document
		if err := decodeJSON(raw, &v1); err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR parsing %s as V1: %v\n", entry.Name(), err)
			continue
		}

		fmt.Printf("  CONVERT %s (%d components)\n", entry.Name(), len(v1.Playlist))

		v2 := convertV1toV2(v1)

		out, err := json.MarshalIndent(v2, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR marshaling V2: %v\n", err)
			continue
		}

		// Backup original
		bakPath := filePath + ".v1.bak"
		if err := os.WriteFile(bakPath, raw, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR backing up to %s: %v\n", bakPath, err)
			continue
		}

		// Write V2
		if err := os.WriteFile(filePath, append(out, '\n'), 0644); err != nil {
			fmt.Fprintf(os.Stderr, "  ERROR writing %s: %v\n", filePath, err)
			continue
		}

		converted++
	}

	fmt.Printf("\nDone: %d converted, %d skipped\n", converted, skipped)
}
