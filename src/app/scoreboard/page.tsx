import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teams as allTeams } from "@/lib/data";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScoreboardPage() {
  const sortedTeams = [...allTeams].sort((a, b) => b.score - a.score);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"; // Gold
      case 2:
        return "text-slate-400"; // Silver
      case 3:
        return "text-yellow-600"; // Bronze
      default:
        return "text-muted-foreground";
    }
  };

  const getHouseColor = (house: string) => {
    switch(house) {
        case 'Gryffindor': return 'border-red-600';
        case 'Slytherin': return 'border-green-600';
        case 'Ravenclaw': return 'border-blue-600';
        case 'Hufflepuff': return 'border-yellow-500';
        default: return 'border-transparent';
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Live Scoreboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          See who's leading the pack in the Pathfinders challenge.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {allTeams.map(team => (
            <Card key={team.id} className={`border-l-4 ${getHouseColor(team.house)}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{team.house} Points</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{team.score}</div>
                    <p className="text-xs text-muted-foreground">{team.name}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>House</TableHead>
              <TableHead className="text-right">Riddles Solved</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.id} className={index < 3 ? "bg-secondary/50" : ""}>
                <TableCell className="text-center">
                  <span className={`text-xl font-bold ${getRankColor(index + 1)}`}>
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{team.house}</TableCell>
                <TableCell className="text-right">{team.riddlesSolved}</TableCell>
                <TableCell className="text-right font-bold text-lg">{team.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
